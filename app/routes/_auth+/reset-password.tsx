import { conform, useForm } from '@conform-to/react';
import { getFieldsetConstraint, parse } from '@conform-to/zod';
import { Form, useActionData, useLoaderData } from '@remix-run/react';
import { z } from 'zod';
import { GeneralErrorBoundary } from '~/components/error-boundary';
import { ErrorList, Field } from '~/components/forms';
import { StatusButton } from '~/components/ui/status-button';
import { invariant, useIsPending } from '~/utils/misc';
import { PasswordSchema } from '~/utils/user-validation';
import { verifySessionStorage } from '~/utils/verification.server';
import { type VerifyFunctionArgs } from './verify';
import { buildDbClient } from '~/utils/client';
import { eq, or } from 'drizzle-orm';
import { users } from '~/drizzle/schema.server';
import {
	ActionFunctionArgs,
	AppLoadContext,
	LoaderFunctionArgs,
	MetaFunction,
	json,
	redirect,
} from '@remix-run/cloudflare';
import { requireAnonymous, resetUserPassword } from '~/utils/auth.server';

const resetPasswordUsernameSessionKey = 'resetPasswordUsername';

export async function handleVerification({
	request,
	context,
	submission,
}: VerifyFunctionArgs) {
	invariant(submission.value, 'submission.value should be defined by now');
	const target = submission.value.target;
	const db = buildDbClient(context);
	const user = await db.query.users.findFirst({
		columns: { email: true, username: true },
		where: or(eq(users.email, target), eq(users.username, target)),
	});
	// we don't want to say the user is not found if the email is not found
	// because that would allow an attacker to check if an email is registered
	if (!user) {
		submission.error.code = ['Invalid code'];
		return json({ status: 'error', submission } as const, { status: 400 });
	}

	const verifySession = await verifySessionStorage.getSession(
		request.headers.get('cookie')
	);
	verifySession.set(resetPasswordUsernameSessionKey, user.username);
	return redirect('/reset-password', {
		headers: {
			'set-cookie': await verifySessionStorage.commitSession(verifySession),
		},
	});
}

const ResetPasswordSchema = z
	.object({
		password: PasswordSchema,
		confirmPassword: PasswordSchema,
	})
	.refine(({ confirmPassword, password }) => password === confirmPassword, {
		message: 'The passwords did not match',
		path: ['confirmPassword'],
	});

async function requireResetPasswordUsername(
	request: Request,
	context: AppLoadContext
) {
	await requireAnonymous(request, context);
	const verifySession = await verifySessionStorage.getSession(
		request.headers.get('cookie')
	);
	const resetPasswordUsername = verifySession.get(
		resetPasswordUsernameSessionKey
	);
	if (typeof resetPasswordUsername !== 'string' || !resetPasswordUsername) {
		throw redirect('/login');
	}
	return resetPasswordUsername;
}

export async function loader({ request, context }: LoaderFunctionArgs) {
	const resetPasswordUsername = await requireResetPasswordUsername(
		request,
		context
	);
	return json({ resetPasswordUsername });
}

export async function action({ request, context }: ActionFunctionArgs) {
	const resetPasswordUsername = await requireResetPasswordUsername(
		request,
		context
	);
	const formData = await request.formData();
	const submission = parse(formData, {
		schema: ResetPasswordSchema,
	});
	if (submission.intent !== 'submit') {
		return json({ status: 'idle', submission } as const);
	}
	if (!submission.value?.password) {
		return json({ status: 'error', submission } as const, { status: 400 });
	}

	const { password } = submission.value;

	await resetUserPassword({
		context,
		username: resetPasswordUsername,
		pwd: password,
	});
	const verifySession = await verifySessionStorage.getSession(
		request.headers.get('cookie')
	);
	return redirect('/login', {
		headers: {
			'set-cookie': await verifySessionStorage.destroySession(verifySession),
		},
	});
}

export const meta: MetaFunction = () => {
	return [{ title: 'Reset Password | Resumaker' }];
};

export default function ResetPasswordPage() {
	const data = useLoaderData<typeof loader>();
	const actionData = useActionData<typeof action>();
	const isPending = useIsPending();

	const [form, fields] = useForm({
		id: 'reset-password',
		constraint: getFieldsetConstraint(ResetPasswordSchema),
		lastSubmission: actionData?.submission,
		onValidate({ formData }) {
			return parse(formData, { schema: ResetPasswordSchema });
		},
		shouldRevalidate: 'onBlur',
	});

	return (
		<>
			<div className='flex flex-col space-y-2 text-center'>
				<h1 className='text-2xl font-semibold tracking-tight'>
					Password Reset
				</h1>
				<p className='text-sm text-muted-foreground'>
					Hi, {data.resetPasswordUsername}. No worries. It happens all the time.
				</p>
			</div>
			<div className='grid gap-6'>
				<Form className='space-y-6' method='POST' {...form.props}>
					<div className='space-y-2'>
						<Field
							labelProps={{
								htmlFor: fields.password.id,
								children: 'New Password',
							}}
							inputProps={{
								...conform.input(fields.password, { type: 'password' }),
								autoComplete: 'new-password',
								autoFocus: true,
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

					<ErrorList errors={form.errors} id={form.errorId} />

					<StatusButton
						className='w-full'
						status={isPending ? 'pending' : actionData?.status ?? 'idle'}
						type='submit'
						disabled={isPending}
					>
						Reset password
					</StatusButton>
				</Form>
			</div>
		</>
	);
}

export function ErrorBoundary() {
	return <GeneralErrorBoundary />;
}
