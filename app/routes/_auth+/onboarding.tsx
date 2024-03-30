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
import {
	Form,
	useActionData,
	useLoaderData,
	useSearchParams,
} from '@remix-run/react';
import { eq } from 'drizzle-orm';
import { AuthenticityTokenInput } from 'remix-utils/csrf/react';
import { safeRedirect } from 'remix-utils/safe-redirect';
import { z } from 'zod';
import { CheckboxField, ErrorList, Field } from '~/components/forms';
import { StatusButton } from '~/components/ui/status-button';
import { users } from '~/drizzle/schema.server';
import { requireAnonymous, sessionKey, signup } from '~/utils/auth.server';
import { buildDbClient } from '~/utils/client';
import { validateCSRF } from '~/utils/csrf.server';
import { invariant, invariantResponse, useIsPending } from '~/utils/misc';
import { sessionStorage } from '~/utils/session.server';
import {
	NameSchema,
	PasswordSchema,
	UsernameSchema,
} from '~/utils/user-validation';
import { verifySessionStorage } from '~/utils/verification.server';
import { VerifyFunctionArgs } from './verify';

const onboardingEmailSessionKey = 'onboardingEmail';

const SignupFormSchema = z
	.object({
		username: UsernameSchema,
		name: NameSchema,
		password: PasswordSchema,
		confirmPassword: PasswordSchema,
		agreeToTermsOfServiceAndPrivacyPolicy: z.boolean({
			required_error:
				'You must agree to the terms of service and privacy policy',
		}),
		remember: z.boolean().optional(),
		redirectTo: z.string().optional(),
	})
	.superRefine(({ confirmPassword, password }, ctx) => {
		if (confirmPassword !== password) {
			ctx.addIssue({
				path: ['confirmPassword'],
				code: 'custom',
				message: 'The passwords must match',
			});
		}
	});

async function requireOnboardingEmail(
	request: Request,
	context: AppLoadContext
) {
	await requireAnonymous(request, context);
	const verifySession = await verifySessionStorage.getSession(
		request.headers.get('cookie')
	);
	const email = verifySession.get(onboardingEmailSessionKey);
	if (typeof email !== 'string' || !email) {
		throw redirect('/signup');
	}
	return email;
}

export async function loader({ request, context }: LoaderFunctionArgs) {
	const email = await requireOnboardingEmail(request, context);
	return json({ email });
}

export async function action({ request, context }: ActionFunctionArgs) {
	const email = await requireOnboardingEmail(request, context);

	const formData = await request.formData();
	await validateCSRF(formData, request.headers);
	invariantResponse(
		!formData.get('name__confirm'),
		'Form not submitted properly'
	);
	const submission = await parse(formData, {
		schema: SignupFormSchema.superRefine(async (data, ctx) => {
			const db = buildDbClient(context);
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
			const session = await signup({
				...data,
				email,
				context,
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

	const verifySession = await verifySessionStorage.getSession(
		request.headers.get('cookie')
	);
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
		defaultValue: { redirectTo },
		lastSubmission: actionData?.submission,
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
			<div className='grid gap-6'>
				<Form
					method='POST'
					className='mx-auto min-w-[368px] max-w-sm space-y-6'
					{...form.props}
				>
					<AuthenticityTokenInput />
					<div className='space-y-2'>
						<Field
							labelProps={{ htmlFor: fields.username.id, children: 'Username' }}
							inputProps={{
								...conform.input(fields.username),
								autoComplete: 'username',
								className: 'lowercase',
								placeholder: 'harrison_johnson',
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
								placeholder: 'Harrison Johnson',
							}}
							errors={fields.name.errors}
						/>
					</div>
					<div className='space-y-2'>
						<Field
							labelProps={{ htmlFor: fields.password.id, children: 'Password' }}
							inputProps={{
								...conform.input(fields.password, { type: 'password' }),
								autoComplete: 'new-password',
							}}
							errors={fields.password.errors}
						/>
					</div>
					<div className='space-y-2'>
						<Field
							labelProps={{
								htmlFor: fields.confirmPassword.id,
								children: 'Confirm Password',
							}}
							inputProps={{
								...conform.input(fields.confirmPassword, { type: 'password' }),
								autoComplete: 'new-password',
							}}
							errors={fields.confirmPassword.errors}
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

					<input {...conform.input(fields.redirectTo, { type: 'hidden' })} />
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
