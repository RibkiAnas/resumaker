import {
	AppLoadContext,
	LoaderFunctionArgs,
	MetaFunction,
	json,
	redirect,
} from '@remix-run/cloudflare';
import { useSearchParams } from '@remix-run/react';
import { GeneralErrorBoundary } from '~/components/error-boundary';
import { combineResponseInits, invariant } from '~/utils/misc';
import { sessionStorage } from '~/utils/session.server';
import { requireAnonymous, sessionKey } from '~/utils/auth.server';
import { safeRedirect } from 'remix-utils/safe-redirect';
import { buildDbClient } from '~/utils/client';
import { eq } from 'drizzle-orm';
import { sessions } from '~/drizzle/schema.server';
import { verifySessionStorage } from '~/utils/verification.server';
import { VerifyFunctionArgs } from './verify';
import { redirectWithToast } from '~/utils/toast.server';
import { ProviderConnectionForm } from '~/utils/connections';

const verifiedTimeKey = 'verified-time';
const unverifiedSessionIdKey = 'unverified-session-id';
const rememberKey = 'remember-me';

export async function handleNewSession(
	{
		request,
		session,
		redirectTo,
		remember = false,
	}: {
		request: Request;
		context?: AppLoadContext;
		session: { userId: string; id: string; expirationDate: Date | null };
		redirectTo?: string;
		remember?: boolean;
	},
	responseInit?: ResponseInit
) {
	const cookieSession = await sessionStorage.getSession(
		request.headers.get('cookie')
	);
	cookieSession.set(sessionKey, session.id);

	return redirect(
		safeRedirect(redirectTo),
		combineResponseInits(
			{
				headers: {
					'set-cookie': await sessionStorage.commitSession(cookieSession, {
						expires: remember ? session.expirationDate! : undefined,
					}),
				},
			},
			responseInit
		)
	);
}

export async function handleVerification({
	request,
	context,
	submission,
}: VerifyFunctionArgs) {
	invariant(submission.value, 'Submission should have a value by this point');
	const cookieSession = await sessionStorage.getSession(
		request.headers.get('cookie')
	);
	const verifySession = await verifySessionStorage.getSession(
		request.headers.get('cookie')
	);

	const remember = verifySession.get(rememberKey);
	const { redirectTo } = submission.value;
	const headers = new Headers();

	cookieSession.set(verifiedTimeKey, Date.now());

	const unverifiedSessionId = verifySession.get(unverifiedSessionIdKey);
	const db = buildDbClient(context);
	if (unverifiedSessionId) {
		const session = await db.query.sessions.findFirst({
			columns: { expirationDate: true },
			where: eq(sessions.id, unverifiedSessionId),
		});
		if (!session) {
			throw await redirectWithToast('/login', {
				type: 'error',
				title: 'Invalid session',
				description: 'Could not find session to verify. Please try again.',
			});
		}

		cookieSession.set(sessionKey, unverifiedSessionId);

		headers.append(
			'set-cookie',
			await sessionStorage.commitSession(cookieSession, {
				expires: remember ? session.expirationDate! : undefined,
			})
		);
	} else {
		headers.append(
			'set-cookie',
			await sessionStorage.commitSession(cookieSession)
		);
	}

	headers.append(
		'set-cookie',
		await verifySessionStorage.destroySession(verifySession)
	);

	return redirect(safeRedirect(redirectTo), { headers });
}

export async function loader({ request, context }: LoaderFunctionArgs) {
	await requireAnonymous(request, context);
	return json({});
}

export default function LoginPage() {
	const [searchParams] = useSearchParams();
	const redirectTo = searchParams.get('redirectTo');

	return (
		<>
			<div className='flex flex-col space-y-2 text-center'>
				<h1 className='text-2xl font-semibold tracking-tight'>Welcome back!</h1>
				<p className='text-sm text-muted-foreground'>
					Please enter your details.
				</p>
			</div>
			<div className='grid gap-6'>
				<ProviderConnectionForm
					type='Login'
					providerName='github'
					redirectTo={redirectTo}
				/>
			</div>
		</>
	);
}

export const meta: MetaFunction = () => {
	return [{ title: 'Login to Resumaker' }];
};

export function ErrorBoundary() {
	return <GeneralErrorBoundary />;
}
