import { conform, useForm } from '@conform-to/react';
import { getFieldsetConstraint, parse } from '@conform-to/zod';
import * as E from '@react-email/components';
import { useFetcher } from '@remix-run/react';
import { AuthenticityTokenInput } from 'remix-utils/csrf/react';
import { z } from 'zod';
import { GeneralErrorBoundary } from '~/components/error-boundary';
import { ErrorList, Field } from '~/components/forms';
import { StatusButton } from '~/components/ui/status-button';
import { validateCSRF } from '~/utils/csrf.server';
import { sendEmail } from '~/utils/email.server';
import { EmailSchema, UsernameSchema } from '~/utils/user-validation';
import { prepareVerification } from './verify';
import {
	ActionFunctionArgs,
	MetaFunction,
	json,
	redirect,
} from '@remix-run/cloudflare';
import { buildDbClient } from '~/utils/client';
import { eq, or } from 'drizzle-orm';
import { users } from '~/drizzle/schema.server';

const ForgotPasswordSchema = z.object({
	usernameOrEmail: z.union([EmailSchema, UsernameSchema]),
});

export async function action({ request, context }: ActionFunctionArgs) {
	const formData = await request.formData();
	await validateCSRF(formData, request.headers);
	const db = buildDbClient(context);
	const submission = await parse(formData, {
		schema: ForgotPasswordSchema.superRefine(async (data, ctx) => {
			const user = await db.query.users.findFirst({
				columns: { id: true },
				where: or(
					eq(users.email, data.usernameOrEmail),
					eq(users.username, data.usernameOrEmail)
				),
			});
			if (!user) {
				ctx.addIssue({
					path: ['usernameOrEmail'],
					code: z.ZodIssueCode.custom,
					message: 'No user exists with this username or email',
				});
				return;
			}
		}),
		async: true,
	});
	if (submission.intent !== 'submit') {
		return json({ status: 'idle', submission } as const);
	}
	if (!submission.value) {
		return json({ status: 'error', submission } as const, { status: 400 });
	}
	const { usernameOrEmail } = submission.value;

	const user = await db.query.users.findFirst({
		columns: { email: true, username: true },
		where: or(
			eq(users.email, usernameOrEmail),
			eq(users.username, usernameOrEmail)
		),
	});

	const { verifyUrl, redirectTo, otp } = await prepareVerification({
		period: 10 * 60,
		request,
		context,
		type: 'reset-password',
		target: usernameOrEmail,
	});

	const response = await sendEmail({
		context,
		to: user?.email ?? 'd',
		subject: `Epic Notes Password Reset`,
		react: (
			<ForgotPasswordEmail onboardingUrl={verifyUrl.toString()} otp={otp} />
		),
	});

	if (response.status === 'success') {
		return redirect(redirectTo.toString());
	} else {
		submission.error[''] = [response.error.message];
		return json({ status: 'error', submission } as const, { status: 500 });
	}
}

function ForgotPasswordEmail({
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
					<E.Text>Resumaker Password Reset</E.Text>
				</h1>
				<p>
					<E.Text>
						Here&apos;s your verification code: <strong>{otp}</strong>
					</E.Text>
				</p>
				<p>
					<E.Text>Or click the link:</E.Text>
				</p>
				<E.Link href={onboardingUrl}>{onboardingUrl}</E.Link>
			</E.Container>
		</E.Html>
	);
}

export const meta: MetaFunction = () => {
	return [{ title: 'Password Recovery for Resumaker' }];
};

export default function ForgotPasswordRoute() {
	const forgotPassword = useFetcher<typeof action>();

	const [form, fields] = useForm({
		id: 'forgot-password-form',
		constraint: getFieldsetConstraint(ForgotPasswordSchema),
		lastSubmission: forgotPassword.data?.submission,
		onValidate({ formData }) {
			return parse(formData, { schema: ForgotPasswordSchema });
		},
		shouldRevalidate: 'onBlur',
	});

	return (
		<>
			<div className='flex flex-col space-y-2 text-center'>
				<h1 className='text-2xl font-semibold tracking-tight'>
					Forgot Password
				</h1>
				<p className='text-sm text-muted-foreground'>
					No worries, we&apos;ll send you reset instructions.
				</p>
			</div>

			<div className='grid gap-6'>
				<forgotPassword.Form method='POST' {...form.props}>
					<AuthenticityTokenInput />
					<div>
						<Field
							labelProps={{
								htmlFor: fields.usernameOrEmail.id,
								children: 'Username or Email',
							}}
							inputProps={{
								autoFocus: true,
								...conform.input(fields.usernameOrEmail),
							}}
							errors={fields.usernameOrEmail.errors}
						/>
					</div>
					<ErrorList errors={form.errors} id={form.errorId} />

					<div className='mt-6'>
						<StatusButton
							className='w-full'
							status={
								forgotPassword.state === 'submitting'
									? 'pending'
									: forgotPassword.data?.status ?? 'idle'
							}
							type='submit'
							disabled={forgotPassword.state !== 'idle'}
						>
							Recover password
						</StatusButton>
					</div>
				</forgotPassword.Form>
			</div>
		</>
	);
}

export function ErrorBoundary() {
	return <GeneralErrorBoundary />;
}
