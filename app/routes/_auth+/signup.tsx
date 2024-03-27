import { conform, useForm } from '@conform-to/react';
import { getFieldsetConstraint, parse } from '@conform-to/zod';
import * as E from '@react-email/components';
import {
	ActionFunctionArgs,
	LoaderFunctionArgs,
	MetaFunction,
	json,
	redirect,
} from '@remix-run/cloudflare';
import { Form, useActionData, useSearchParams } from '@remix-run/react';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { ErrorList, Field } from '~/components/forms';
import { StatusButton } from '~/components/ui/status-button';
import { users } from '~/drizzle/schema.server';
import { buildDbClient } from '~/utils/client';
import { invariantResponse, useIsPending } from '~/utils/misc';
import { EmailSchema } from '~/utils/user-validation';
import { validateCSRF } from '~/utils/csrf.server';
import { requireAnonymous } from '~/utils/auth.server';
import { AuthenticityTokenInput } from 'remix-utils/csrf/react';
import { sendEmail } from '~/utils/email.server';
import { GeneralErrorBoundary } from '~/components/error-boundary';
import { prepareVerification } from './verify';
import { ProviderConnectionForm } from '~/utils/connections';

const SignupSchema = z.object({
	email: EmailSchema,
	redirectTo: z.string().optional(),
});

export async function loader({ request, context }: LoaderFunctionArgs) {
	await requireAnonymous(request, context);
	return json({});
}

export async function action({ request, context }: ActionFunctionArgs) {
	await requireAnonymous(request, context);

	const formData = await request.formData();
	await validateCSRF(formData, request.headers);
	invariantResponse(
		!formData.get('name__confirm'),
		'Form not submitted properly'
	);
	const db = buildDbClient(context);

	const submission = await parse(formData, {
		schema: SignupSchema.superRefine(async (data, ctx) => {
			const existingUser = await db.query.users.findFirst({
				columns: { id: true },
				where: eq(users.email, data.email),
			});
			if (existingUser) {
				ctx.addIssue({
					path: ['email'],
					code: z.ZodIssueCode.custom,
					message: 'A user already exists with this email',
				});
				return;
			}
		}),
		async: true,
	});

	if (submission.intent !== 'submit') {
		return json({ status: 'idle', submission } as const);
	}

	if (!submission.value?.email) {
		return json({ status: 'error', submission } as const, { status: 400 });
	}

	const { email, redirectTo: postVerificationRedirectTo } = submission.value;

	const { verifyUrl, redirectTo, otp } = await prepareVerification({
		period: 10 * 60,
		request,
		context,
		type: 'onboarding',
		target: email,
		redirectTo: postVerificationRedirectTo,
	});

	const response = await sendEmail({
		context,
		to: email,
		subject: `Welcome to Resumaker!`,
		react: <SignupEmail onboardingUrl={verifyUrl.toString()} otp={otp} />,
	});

	if (response.status === 'success') {
		return redirect(redirectTo.toString());
	} else {
		submission.error[''] = [response.error.message];
		return json({ status: 'error', submission } as const, { status: 500 });
	}
}

export function SignupEmail({
	onboardingUrl,
	otp,
}: {
	onboardingUrl: string;
	otp: string;
}) {
	return (
		<E.Html lang='en' dir='ltr'>
			<E.Container>
				<h1>
					<E.Text>Welcome to Epic Notes!</E.Text>
				</h1>
				<p>
					<E.Text>
						Here&apos;s your verification code: <strong>{otp}</strong>
					</E.Text>
				</p>
				<p>
					<E.Text>Or click the link to get started:</E.Text>
				</p>
				<E.Link href={onboardingUrl}>{onboardingUrl}</E.Link>
			</E.Container>
		</E.Html>
	);
}

export default function SignupRoute() {
	const actionData = useActionData<typeof action>();
	const isPending = useIsPending();

	const [searchParams] = useSearchParams();
	const redirectTo = searchParams.get('redirectTo');

	const [form, fields] = useForm({
		id: 'signup-form',
		constraint: getFieldsetConstraint(SignupSchema),
		defaultValue: { redirectTo },
		lastSubmission: actionData?.submission,
		onValidate({ formData }) {
			return parse(formData, { schema: SignupSchema });
		},
		shouldRevalidate: 'onBlur',
	});

	return (
		<>
			<div className='flex flex-col space-y-2 text-center'>
				<h1 className='text-2xl font-semibold tracking-tight'>
					Let&lsquo;s start your journey!
				</h1>
				<p className='text-sm text-muted-foreground'>
					Enter your email below to create your account
				</p>
			</div>

			<div className='grid gap-6'>
				<Form method='POST' {...form.props}>
					<div className='grid gap-2'>
						<div className='grid gap-1'>
							<AuthenticityTokenInput />
							<div style={{ display: 'none' }} aria-hidden>
								<label htmlFor='name__confirm-input'>
									Please leave this field blank
								</label>
								<input
									id='name__confirm-input'
									name='name__confirm'
									type='text'
									tabIndex={-1}
								/>
							</div>
							<Field
								labelProps={{
									htmlFor: fields.email.id,
									children: 'Email',
								}}
								inputProps={{
									...conform.input(fields.email),
									autoFocus: true,
									placeholder: 'name@example.com',
								}}
								errors={fields.email.errors}
							/>
							<input
								{...conform.input(fields.redirectTo, { type: 'hidden' })}
							/>
							<ErrorList errors={form.errors} id={form.errorId} />
							<StatusButton
								className='w-full'
								status={isPending ? 'pending' : actionData?.status ?? 'idle'}
								type='submit'
								disabled={isPending}
							>
								Submit
							</StatusButton>
						</div>
					</div>
				</Form>
				<div className='relative'>
					<div className='absolute inset-0 flex items-center'>
						<span className='w-full border-t' />
					</div>
					<div className='relative flex justify-center text-xs uppercase'>
						<span className='bg-background px-2 text-muted-foreground'>
							Or continue with
						</span>
					</div>
				</div>
				<ProviderConnectionForm
					type='Signup'
					providerName='github'
					redirectTo={redirectTo}
				/>
			</div>
		</>
	);
}

export const meta: MetaFunction = () => {
	return [{ title: 'Sign Up | Epic Notes' }];
};

export function ErrorBoundary() {
	return <GeneralErrorBoundary />;
}
