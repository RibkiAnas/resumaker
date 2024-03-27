import { AppLoadContext, LoaderFunctionArgs, redirect } from "@remix-run/cloudflare";
import { and, eq } from "drizzle-orm";
import { connections, sessions, users } from "~/drizzle/schema.server";
import { authenticator, getSessionExpirationDate, getUserId } from "~/utils/auth.server";
import { buildDbClient } from "~/utils/client";
import { providerLabels } from "~/utils/connections";
import { createToastHeaders, redirectWithToast } from "~/utils/toast.server";
import { handleNewSession } from "./login";
import { createId } from "@paralleldrive/cuid2";
import { verifySessionStorage } from "~/utils/verification.server";
import { onboardingEmailSessionKey, prefilledProfileKey, providerIdKey } from "./onboarding_.$provider";
import { destroyRedirectToHeader, getRedirectCookieValue } from "~/utils/redirect-cookie.server";
import { combineHeaders, combineResponseInits } from "~/utils/misc";

const destroyRedirectTo = { 'set-cookie': destroyRedirectToHeader }

export async function loader({ request, context }: LoaderFunctionArgs) {
	const providerName = 'github'

  const redirectTo = getRedirectCookieValue(request)

  const label = providerLabels[providerName]

	const profile = await authenticator
		.authenticate(providerName, request, { throwOnError: true })
		.catch(async error => {
			console.error(error)
			const loginRedirect = [
				'/login',
				redirectTo ? new URLSearchParams({ redirectTo }) : null,
			]
				.filter(Boolean)
				.join('?')
			throw await redirectWithToast(
				loginRedirect,
				{
					title: 'Auth Failed',
					description: `There was an error authenticating with ${label}.`,
					type: 'error',
				},
				{ headers: destroyRedirectTo },
			)
		})

  const db = buildDbClient(context)

  const existingConnection = await db.query.connections.findFirst({
		columns: { userId: true },
		where: and(
      eq(connections.providerName, providerName),
      eq(connections.providerId, profile.id),
    )
	})

	const userId = await getUserId(request, context)

	if (existingConnection && userId) {
		throw await redirectWithToast('/settings/profile/connections', {
			title: 'Already Connected',
			description:
				existingConnection.userId === userId
					? `Your "${profile.username}" ${label} account is already connected.`
					: `The "${profile.username}" ${label} account is already connected to another account.`,
		},
    { headers: destroyRedirectTo },)
	}

  // If we're already logged in, then link the account
	if (userId) {
		await db.insert(connections).values({
      id: createId(),
			providerName, providerId: profile.id, userId,
		})
		throw await redirectWithToast('/settings/profile/connections', {
			title: 'Connected',
			type: 'success',
			description: `Your "${profile.username}" ${label} account has been connected.`,
		},
    { headers: destroyRedirectTo },)
	}

  // Connection exists already? Make a new session
	if (existingConnection) {
		return makeSession({ request, context, userId: existingConnection.userId, redirectTo })
	}

  // if the email matches a user in the db, then link the account and
	// make a new session
	const user = await db.query.users.findFirst({
		columns: { id: true },
		where: eq(users.email, profile.email.toLowerCase()),
	})
	if (user) {
		await db.insert(connections).values({
      id: createId(),
			providerName,
      providerId: profile.id,
      userId: user.id,
		})
		return makeSession(
			{
				request,
        context,
				userId: user.id,
				// send them to the connections page to see their new connection
				redirectTo: redirectTo ?? '/settings/profile/connections',
			},
			{
				headers: await createToastHeaders({
					title: 'Connected',
					description: `Your "${profile.username}" ${label} account has been connected.`,
				}),
			},
		)
	}

	// this is a new user, so let's get them onboarded
	const verifySession = await verifySessionStorage.getSession(
		request.headers.get('cookie'),
	)
	verifySession.set(onboardingEmailSessionKey, profile.email)
	verifySession.set(prefilledProfileKey, {
		...profile,
		username: profile.username
			?.replace(/[^a-zA-Z0-9_]/g, '_')
			.toLowerCase()
			.slice(0, 20)
			.padEnd(3, '_'),
	})
	verifySession.set(providerIdKey, profile.id)
	const onboardingRedirect = [
		`/onboarding/${providerName}`,
		redirectTo ? new URLSearchParams({ redirectTo }) : null,
	]
		.filter(Boolean)
		.join('?')
	return redirect(onboardingRedirect, {
		headers: combineHeaders(
			{ 'set-cookie': await verifySessionStorage.commitSession(verifySession) },
			destroyRedirectTo,
		),
	})
}

async function makeSession(
	{
		request,
    context,
		userId,
		redirectTo,
	}: { request: Request; context: AppLoadContext; userId: string; redirectTo?: string | null },
	responseInit?: ResponseInit,
) {
	redirectTo ??= '/'
  const db = buildDbClient(context)

	const sessionData = await db.insert(sessions)
    .values({
      id: createId(),
			expirationDate: getSessionExpirationDate(),
			userId,
		})
    .returning({ id: sessions.id, expirationDate: sessions.expirationDate, userId: sessions.userId});
    const session = sessionData[0]

	return handleNewSession(
		{ request, context, session, redirectTo, remember: true },
		combineResponseInits({ headers: destroyRedirectTo }, responseInit),
	)
}
