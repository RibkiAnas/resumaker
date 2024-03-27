import { conform, useForm } from '@conform-to/react';
import { getFieldsetConstraint, parse } from '@conform-to/zod';
import {
	ActionFunctionArgs,
	AppLoadContext,
	LoaderFunctionArgs,
	MetaFunction,
	json,
	redirect,
} from '@remix-run/cloudflare';
import { Form, Link, useActionData, useSearchParams } from '@remix-run/react';
import { z } from 'zod';
import { GeneralErrorBoundary } from '~/components/error-boundary';
import { CheckboxField, ErrorList, Field } from '~/components/forms';
import { StatusButton } from '~/components/ui/status-button';
import {
	combineResponseInits,
	invariant,
	invariantResponse,
	useIsPending,
} from '~/utils/misc';
import { sessionStorage } from '~/utils/session.server';
import { PasswordSchema, UsernameSchema } from '~/utils/user-validation';
import { validateCSRF } from '~/utils/csrf.server';
import { AuthenticityTokenInput } from 'remix-utils/csrf/react';
import { login, requireAnonymous, sessionKey } from '~/utils/auth.server';
import { safeRedirect } from 'remix-utils/safe-redirect';
import { buildDbClient } from '~/utils/client';
import { and, eq } from 'drizzle-orm';
import { sessions, verifications } from '~/drizzle/schema.server';
import { twoFAVerificationType } from '../dashboard/_dashboard/settings/profile/two-factor/_layout';
import { verifySessionStorage } from '~/utils/verification.server';
import { VerifyFunctionArgs, getRedirectToUrl } from './verify';
import { redirectWithToast } from '~/utils/toast.server';
import { ProviderConnectionForm } from '~/utils/connections';

const verifiedTimeKey = 'verified-time';
const unverifiedSessionIdKey = 'unverified-session-id';
const rememberKey = 'remember-me';

export async function handleNewSession(
	{
		request,
		context,
		session,
		redirectTo,
		remember = false,
	}: {
		request: Request;
		context: AppLoadContext;
		session: { userId: string; id: string; expirationDate: Date | null };
		redirectTo?: string;
		remember?: boolean;
	},
	responseInit?: ResponseInit
) {
	if (await shouldRequestTwoFA({ request, context, userId: session.userId })) {
		const verifySession = await verifySessionStorage.getSession();
		verifySession.set(unverifiedSessionIdKey, session.id);
		verifySession.set(rememberKey, remember);
		const redirectUrl = getRedirectToUrl({
			request,
			type: twoFAVerificationType,
			target: session.userId,
		});
		return redirect(
			redirectUrl.toString(),
			combineResponseInits(
				{
					headers: {
						'set-cookie': await verifySessionStorage.commitSession(
							verifySession
						),
					},
				},
				responseInit
			)
		);
	} else {
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

export async function shouldRequestTwoFA({
	request,
	context,
	userId,
}: {
	request: Request;
	context: AppLoadContext;
	userId: string;
}) {
	const verifySession = await verifySessionStorage.getSession(
		request.headers.get('cookie')
	);
	if (verifySession.has(unverifiedSessionIdKey)) return true;
	// if it's over two hours since they last verified, we should request 2FA again
	const db = buildDbClient(context);
	const userHasTwoFA = await db.query.verifications.findFirst({
		columns: { id: true },
		where: and(
			eq(verifications.target, userId),
			eq(verifications.type, twoFAVerificationType)
		),
	});
	if (!userHasTwoFA) return false;
	const cookieSession = await sessionStorage.getSession(
		request.headers.get('cookie')
	);
	const verifiedTime = cookieSession.get(verifiedTimeKey) ?? new Date(0);
	const twoHours = 1000 * 60 * 60 * 2;
	return Date.now() - verifiedTime > twoHours;
}

const LoginFormSchema = z.object({
	username: UsernameSchema,
	password: PasswordSchema,
	redirectTo: z.string().optional(),
	remember: z.boolean().optional(),
});

export async function loader({ request, context }: LoaderFunctionArgs) {
	await requireAnonymous(request, context);
	return json({});
}

export async function action({ request, context }: ActionFunctionArgs) {
	await requireAnonymous(request, context);

	const formData = await request.formData();
	await validateCSRF(formData, request.headers);
	invariantResponse(!formData.get('name'), 'Form not submitted properly');

	const submission = await parse(formData, {
		schema: (intent) =>
			LoginFormSchema.transform(async (data, ctx) => {
				if (intent !== 'submit') return { ...data, session: null };

				const session = await login({
					username: data.username,
					password: data.password,
					context: context,
				});

				if (!session) {
					ctx.addIssue({
						code: 'custom',
						message: 'Invalid username or password',
					});
					return z.NEVER;
				}

				return { ...data, session };
			}),
		async: true,
	});
	// get the password off the payload that's sent back
	delete submission.payload.password;

	if (submission.intent !== 'submit') {
		// @ts-expect-error - conform should probably have support for doing this
		delete submission.value?.password;
		return json({ status: 'idle', submission } as const);
	}

	if (!submission.value?.session) {
		return json({ status: 'error', submission } as const, { status: 400 });
	}

	const { session, remember, redirectTo } = submission.value;

	return handleNewSession({ request, context, session, remember, redirectTo });
}

export default function LoginPage() {
	const actionData = useActionData<typeof action>();
	const isPending = useIsPending();

	const [searchParams] = useSearchParams();
	const redirectTo = searchParams.get('redirectTo');

	const [form, fields] = useForm({
		id: 'login-form',
		constraint: getFieldsetConstraint(LoginFormSchema),
		defaultValue: { redirectTo },
		lastSubmission: actionData?.submission,
		onValidate({ formData }) {
			return parse(formData, { schema: LoginFormSchema });
		},
		shouldRevalidate: 'onBlur',
	});

	return (
		<>
			<div className='flex flex-col space-y-2 text-center'>
				<h1 className='text-2xl font-semibold tracking-tight'>Welcome back!</h1>
				<p className='text-sm text-muted-foreground'>
					Please enter your details.
				</p>
			</div>
			<div className='grid gap-6'>
				<Form method='POST' {...form.props}>
					<AuthenticityTokenInput />
					<div style={{ display: 'none' }} aria-hidden>
						<label htmlFor='name-input'>Please leave this field blank</label>
						<input id='name-input' name='name' type='text' tabIndex={-1} />
					</div>
					<Field
						labelProps={{ children: 'Username' }}
						inputProps={{
							...conform.input(fields.username),
							autoFocus: true,
							className: 'lowercase',
							placeholder: 'username',
						}}
						errors={fields.username.errors}
					/>

					<Field
						labelProps={{ children: 'Password' }}
						inputProps={conform.input(fields.password, {
							type: 'password',
						})}
						errors={fields.password.errors}
					/>

					<div className='flex justify-between text-sm'>
						<CheckboxField
							labelProps={{
								htmlFor: fields.remember.id,
								children: 'Remember me',
							}}
							buttonProps={conform.input(fields.remember, {
								type: 'checkbox',
							})}
							errors={fields.remember.errors}
						/>
						<div>
							<Link
								to='/forgot-password'
								className='text-body-xs font-semibold'
							>
								Forgot password?
							</Link>
						</div>
					</div>

					<input {...conform.input(fields.redirectTo, { type: 'hidden' })} />

					<ErrorList errors={form.errors} id={form.errorId} />

					<div className='flex items-center justify-between gap-6 pt-3'>
						<StatusButton
							className='w-full'
							status={isPending ? 'pending' : actionData?.status ?? 'idle'}
							type='submit'
							disabled={isPending}
						>
							Log in
						</StatusButton>
					</div>
				</Form>
				<div className='relative'>
					<div className='absolute inset-0 flex items-center'>
						<span className='w-full border-t' />
					</div>
					<div className='relative flex justify-center text-xs uppercase'>
						<span className='bg-background px-2 text-muted-foreground'>Or</span>
					</div>
				</div>
				<ProviderConnectionForm
					type='Login'
					providerName='github'
					redirectTo={redirectTo}
				/>
			</div>

			<div className='flex items-center justify-center gap-2 pt-6 text-sm'>
				<span className='text-muted-foreground'>New here?</span>
				<Link
					to={
						redirectTo ? `/signup?${encodeURIComponent(redirectTo)}` : '/signup'
					}
				>
					Create an account
				</Link>
			</div>
		</>
	);
}

export const meta: MetaFunction = () => {
	return [{ title: 'Login to Epic Notes' }];
};

export function ErrorBoundary() {
	return <GeneralErrorBoundary />;
}
