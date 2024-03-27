import { buildDbClient } from "./client";
import { AppLoadContext, redirect } from "@remix-run/cloudflare";
import { and, eq, gt, or } from "drizzle-orm";
import {
  connections,
	password,
	password as pwd,
	roles,
	rolesToUsers,
	sessions,
	userImage,
	users,
} from "~/drizzle/schema.server";
import { sessionStorage } from "./session.server";
import bcrypt from "bcryptjs";
import { safeRedirect } from "remix-utils/safe-redirect";
import { Authenticator } from "remix-auth";
import { combineResponseInits, downloadFile } from "./misc";
import { createId } from "@paralleldrive/cuid2";
import { connectionSessionStorage, providers } from "./connections.server";
import { ProviderUser } from "./providers/provider";
import { ProviderName } from "./connections";

const SESSION_EXPIRATION_TIME = 1000 * 60 * 60 * 24 * 30;
export const getSessionExpirationDate = () =>
	new Date(Date.now() + SESSION_EXPIRATION_TIME);

export const sessionKey = "sessionId";

export const authenticator = new Authenticator<ProviderUser>(
	connectionSessionStorage,
)

for (const [providerName, provider] of Object.entries(providers)) {
	authenticator.use(provider.getAuthStrategy(), providerName)
}

export async function getUserId(request: Request, context: AppLoadContext) {
	const db = buildDbClient(context);

	const cookieSession = await sessionStorage.getSession(
		request.headers.get("cookie")
	);
	const sessionId = cookieSession.get(sessionKey);
	if (!sessionId) return null;

	const session = await db.query.sessions.findFirst({
		columns: { userId: true },
		where: and(
			eq(sessions.id, sessionId),
			gt(sessions.expirationDate, new Date())
		),
	});

	if (!session) {
		throw await logout({ request, context });
	}
	return session.userId;
}

export async function requireUserId(
	request: Request,
	context: AppLoadContext,
	{ redirectTo }: { redirectTo?: string | null } = {}
) {
	const userId = await getUserId(request, context);
	if (!userId) {
		const requestUrl = new URL(request.url);
		redirectTo =
			redirectTo === null
				? null
				: redirectTo ?? `${requestUrl.pathname}${requestUrl.search}`;
		const loginParams = redirectTo ? new URLSearchParams({ redirectTo }) : null;
		const loginRedirect = ["/login", loginParams?.toString()]
			.filter(Boolean)
			.join("?");
		throw redirect(loginRedirect);
	}
	return userId;
}

export async function requireAnonymous(
	request: Request,
	context: AppLoadContext
) {
	const userId = await getUserId(request, context);
	if (userId) {
		throw redirect("/");
	}
}

export async function requireUser(request: Request, context: AppLoadContext) {
	const userId = await requireUserId(request, context);
	const db = buildDbClient(context);

	const user = await db.query.users.findFirst({
		columns: { id: true, username: true },
		where: eq(users.id, userId),
	});

	if (!user) {
		throw await logout({ request, context });
	}

	return user;
}

export async function login({
	username,
	password,
	context,
}: {
	username: string;
	password: string;
	context: AppLoadContext;
}) {
	const user = verifyUserPassword({ password, context, username });
	if (!user) return null;

	const db = buildDbClient(context);

	const userId = await user.then((user) => user?.id).catch(() => {});

	if (!userId) {
		return null;
	}

	const session = await db
		.insert(sessions)
		.values({
			id: createId(),
			expirationDate: getSessionExpirationDate(),
			userId: userId,
		})
		.returning({
			id: sessions.id,
			expirationDate: sessions.expirationDate,
			userId: sessions.userId,
		});

	return {
		id: session[0].id,
		expirationDate: session[0].expirationDate,
		userId: session[0].userId,
	};
}

export async function resetUserPassword({
	context,
	username,
	pwd,
}: {
	context: AppLoadContext;
	username: string;
	pwd: string;
}) {
	const hashedPassword = await bcrypt.hash(pwd, 10);
	const db = buildDbClient(context);

	const user = await db.query.users.findFirst({
		columns: { id: true },
		where: eq(users.username, username),
	});

	await db
		.update(password)
		.set({
			hash: hashedPassword,
		})
		.where(eq(password.userId, user!.id))
		.returning({ hash: password.hash });

	return user;
}

export async function signup({
	email,
	username,
	password,
	name,
	context,
}: {
	email: string;
	username: string;
	name: string;
	password: string;
	context: AppLoadContext;
}) {
	const db = buildDbClient(context);

	const hashedPassword = await getPasswordHash(password);

	const user = await db
		.insert(users)
		.values({
			id: createId(),
			email: email.toLowerCase(),
			username: username.toLowerCase(),
			name,
		})
		.returning({ id: users.id });

	const role = await db.query.roles.findFirst({
		columns: { id: true },
		where: eq(roles.name, "user"),
	});

	await db.insert(rolesToUsers).values({
		roleId: role!.id!,
		userId: user[0].id,
	});

	await db.insert(pwd).values({
		hash: hashedPassword,
		userId: user[0].id,
	});

	const session = await db
		.insert(sessions)
		.values({
			id: createId(),
			userId: user[0].id,
			expirationDate: getSessionExpirationDate(),
		})
		.returning({ id: sessions.id, expirationDate: sessions.expirationDate });

	return { id: session[0].id, expirationDate: session[0].expirationDate };
}

export async function signupWithConnection({
	context,
	email,
	username,
	name,
  providerId,
	providerName,
	imageUrl,
}: {
	context: AppLoadContext;
	email: string;
	username: string;
	name: string;
  providerId: string;
	providerName: ProviderName;
	imageUrl?: string;
}) {
	const db = buildDbClient(context);

	const user = await db
		.insert(users)
		.values({
			id: createId(),
			email: email.toLowerCase(),
			username: username.toLowerCase(),
			name,
		})
		.returning({ id: users.id });

	const role = await db.query.roles.findFirst({
		columns: { id: true },
		where: eq(roles.name, "user"),
	});

	await db.insert(rolesToUsers).values({
		roleId: role!.id!,
		userId: user[0].id,
	});

	await db.insert(connections).values({
		id: createId(),
    providerId,
    providerName,
    userId: user[0].id,
	});

  await db.insert(userImage).values({
    id: createId(),
    ...await downloadFile(imageUrl ?? ''),
    userId: user[0].id
  })

	const session = await db
		.insert(sessions)
		.values({
			id: createId(),
			userId: user[0].id,
			expirationDate: getSessionExpirationDate(),
		})
		.returning({ id: sessions.id, expirationDate: sessions.expirationDate });

	return { id: session[0].id, expirationDate: session[0].expirationDate };
}

export async function logout(
	{
		request,
		context,
		redirectTo = "/",
	}: {
		request: Request;
		context: AppLoadContext;
		redirectTo?: string;
	},
	responseInit?: ResponseInit
) {
	const cookieSession = await sessionStorage.getSession(
		request.headers.get("cookie")
	);
	const sessionId = cookieSession.get(sessionKey);
	// delete the session if it exists, but don't wait for it, go ahead an log the user out
	if (sessionId) {
		const db = buildDbClient(context);

		await db.delete(sessions).where(eq(sessions.id, sessionId)).all();
	}
	throw redirect(
		safeRedirect(redirectTo),
		combineResponseInits(responseInit, {
			headers: {
				"set-cookie": await sessionStorage.destroySession(cookieSession),
			},
		})
	);
}

export async function getPasswordHash(password: string) {
	const hash = await bcrypt.hash(password, 10);
	return hash;
}

export async function verifyUserPassword({
	password,
	context,
	username,
	id,
}: {
	username?: string;
	id?: string;
	password: string;
	context: AppLoadContext;
}) {
	const db = buildDbClient(context);

	const userWithPassword = await db.transaction(async (tx) => {
		return await tx.query.users.findFirst({
			columns: { id: true },
			with: {
				password: { columns: { hash: true } },
			},
			where: or(eq(users.username, username ?? ""), eq(users.id, id ?? "")),
		});
	});

	if (!userWithPassword || !userWithPassword.password) {
		return null;
	}

	const isValid = await bcrypt.compare(
		password,
		userWithPassword.password.hash!
	);

	if (!isValid) {
		return null;
	}

	return { id: userWithPassword.id };
}
