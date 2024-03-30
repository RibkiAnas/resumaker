import { conform, useForm } from '@conform-to/react';
import { getFieldsetConstraint, parse } from '@conform-to/zod';
import {
	Form,
	useActionData,
	useLoaderData,
	useSearchParams,
	type Params,
} from '@remix-run/react';
import { safeRedirect } from 'remix-utils/safe-redirect';
import { z } from 'zod';
import { CheckboxField, ErrorList, Field } from '~/components/forms';
import { StatusButton } from '~/components/ui/status-button';
import {
	authenticator,
	requireAnonymous,
	sessionKey,
	signupWithConnection,
} from '~/utils/auth.server';
import { ProviderNameSchema } from '~/utils/connections';
import { invariant, useIsPending } from '~/utils/misc';
import { sessionStorage } from '~/utils/session.server';
import { NameSchema, UsernameSchema } from '~/utils/user-validation';
import { verifySessionStorage } from '~/utils/verification.server';
import { type VerifyFunctionArgs } from './verify';
import {
	ActionFunctionArgs,
	AppLoadContext,
	LoaderFunctionArgs,
	MetaFunction,
	json,
	redirect,
} from '@remix-run/cloudflare';
import { buildDbClient } from '~/utils/client';
import { eq } from 'drizzle-orm';
import { users } from '~/drizzle/schema.server';

export const onboardingEmailSessionKey = 'onboardingEmail';
export const providerIdKey = 'providerId';
export const prefilledProfileKey = 'prefilledProfile';

const SignupFormSchema = z.object({
	imageUrl: z.string().optional(),
	username: UsernameSchema,
	name: NameSchema,
	agreeToTermsOfServiceAndPrivacyPolicy: z.boolean({
		required_error: 'You must agree to the terms of service and privacy policy',
	}),
	remember: z.boolean().optional(),
	redirectTo: z.string().optional(),
});

async function requireData({
	request,
	context,
	params,
}: {
	request: Request;
	context: AppLoadContext;
	params: Params;
}) {
	await requireAnonymous(request, context);
	const verifySession = await verifySessionStorage.getSession(
		request.headers.get('cookie')
	);
	const email = verifySession.get(onboardingEmailSessionKey);
	const providerId = verifySession.get(providerIdKey);
	const result = z
		.object({
			email: z.string(),
			providerName: ProviderNameSchema,
			providerId: z.string(),
		})
		.safeParse({ email, providerName: params.provider, providerId });
	if (result.success) {
		return result.data;
	} else {
		console.error(result.error);
		throw redirect('/signup');
	}
}

export async function loader({ request, context, params }: LoaderFunctionArgs) {
	const { email } = await requireData({ request, context, params });
	const cookieSession = await sessionStorage.getSession(
		request.headers.get('cookie')
	);
	const verifySession = await verifySessionStorage.getSession(
		request.headers.get('cookie')
	);
	const prefilledProfile = verifySession.get(prefilledProfileKey);

	const formError = cookieSession.get(authenticator.sessionErrorKey);

	return json({
		email,
		status: 'idle',
		submission: {
			intent: '',
			payload: (prefilledProfile ?? {}) as Record<string, unknown>,
			error: {
				'': typeof formError === 'string' ? [formError] : [],
			},
		},
	});
}

export async function action({ request, context, params }: ActionFunctionArgs) {
	const { email, providerId, providerName } = await requireData({
		request,
		context,
		params,
	});
	const formData = await request.formData();
	const verifySession = await verifySessionStorage.getSession(
		request.headers.get('cookie')
	);

	const db = buildDbClient(context);

	const submission = await parse(formData, {
		schema: SignupFormSchema.superRefine(async (data, ctx) => {
			const existingUser = await db.query.users.findFirst({
				columns: { id: true },
				where: eq(users.username, data.username),
			});
			if (existingUser) {
				ctx.addIssue({
					path: ['username'],
					code: z.ZodIssueCode.custom,
					message: 'A user already exists with this username',
				});
				return;
			}
		}).transform(async (data) => {
			const session = await signupWithConnection({
				context,
				...data,
				email,
				providerId,
				providerName,
			});
			return { ...data, session };
		}),
		async: true,
	});

	if (submission.intent !== 'submit') {
		return json({ status: 'idle', submission } as const);
	}
	if (!submission.value?.session) {
		return json({ status: 'error', submission } as const, { status: 400 });
	}

	const { session, remember, redirectTo } = submission.value;

	const cookieSession = await sessionStorage.getSession(
		request.headers.get('cookie')
	);
	cookieSession.set(sessionKey, session.id);
	const headers = new Headers();
	headers.append(
		'set-cookie',
		await sessionStorage.commitSession(cookieSession, {
			expires: remember ? session.expirationDate! : undefined,
		})
	);
	headers.append(
		'set-cookie',
		await verifySessionStorage.destroySession(verifySession)
	);

	return redirect(safeRedirect(redirectTo), { headers });
}

export async function handleVerification({
	request,
	submission,
}: VerifyFunctionArgs) {
	invariant(submission.value, 'submission.value should be defined by now');
	const verifySession = await verifySessionStorage.getSession(
		request.headers.get('cookie')
	);
	verifySession.set(onboardingEmailSessionKey, submission.value.target);
	return redirect('/onboarding', {
		headers: {
			'set-cookie': await verifySessionStorage.commitSession(verifySession),
		},
	});
}

export const meta: MetaFunction = () => {
	return [{ title: 'Setup Your Account' }];
};

export default function SignupRoute() {
	const data = useLoaderData<typeof loader>();
	const actionData = useActionData<typeof action>();
	const isPending = useIsPending();
	const [searchParams] = useSearchParams();
	const redirectTo = searchParams.get('redirectTo');

	const [form, fields] = useForm({
		id: 'signup-form',
		constraint: getFieldsetConstraint(SignupFormSchema),
		lastSubmission: actionData?.submission ?? data.submission,
		onValidate({ formData }) {
			return parse(formData, { schema: SignupFormSchema });
		},
		shouldRevalidate: 'onBlur',
	});

	return (
		<>
			<div className='flex flex-col space-y-2 text-center'>
				<h1 className='text-2xl font-semibold tracking-tight'>
					Welcome aboard {data.email}!
				</h1>
				<p className='text-sm text-muted-foreground'>
					Please enter your details.
				</p>
			</div>
			<div className='grid gap-6 min-h-full '>
				<Form
					method='POST'
					className='mx-auto min-w-[368px] max-w-sm space-y-6'
					{...form.props}
				>
					{fields.imageUrl.defaultValue ? (
						<div className='mb-4 flex flex-col items-center justify-center gap-4'>
							<img
								src={fields.imageUrl.defaultValue}
								alt='Profile'
								className='h-14 w-14 rounded-full'
							/>
							<p className='text-sm text-muted-foreground'>
								You can change your photo later
							</p>
							<input {...conform.input(fields.imageUrl, { type: 'hidden' })} />
						</div>
					) : null}
					<div className='space-y-2'>
						<Field
							labelProps={{ htmlFor: fields.username.id, children: 'Username' }}
							inputProps={{
								...conform.input(fields.username),
								autoComplete: 'username',
								className: 'lowercase',
							}}
							errors={fields.username.errors}
						/>
					</div>
					<div className='space-y-2'>
						<Field
							labelProps={{ htmlFor: fields.name.id, children: 'Name' }}
							inputProps={{
								...conform.input(fields.name),
								autoComplete: 'name',
							}}
							errors={fields.name.errors}
						/>
					</div>
					<div>
						<CheckboxField
							labelProps={{
								htmlFor: fields.agreeToTermsOfServiceAndPrivacyPolicy.id,
								children:
									'Do you agree to our Terms of Service and Privacy Policy?',
								className: 'text-sm',
							}}
							buttonProps={conform.input(
								fields.agreeToTermsOfServiceAndPrivacyPolicy,
								{ type: 'checkbox' }
							)}
							errors={fields.agreeToTermsOfServiceAndPrivacyPolicy.errors}
						/>
						<CheckboxField
							labelProps={{
								htmlFor: fields.remember.id,
								children: 'Remember me',
								className: 'text-sm',
							}}
							buttonProps={conform.input(fields.remember, { type: 'checkbox' })}
							errors={fields.remember.errors}
						/>
					</div>

					{redirectTo ? (
						<input type='hidden' name='redirectTo' value={redirectTo} />
					) : null}

					<ErrorList errors={form.errors} id={form.errorId} />

					<div className='flex items-center justify-between gap-6'>
						<StatusButton
							className='w-full'
							status={isPending ? 'pending' : actionData?.status ?? 'idle'}
							type='submit'
							disabled={isPending}
						>
							Create an account
						</StatusButton>
					</div>
				</Form>
			</div>
		</>
	);
}
