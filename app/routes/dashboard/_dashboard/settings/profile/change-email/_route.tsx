import { conform, useForm } from '@conform-to/react';
import { getFieldsetConstraint, parse } from '@conform-to/zod';
import * as E from '@react-email/components';
import {
	ActionFunctionArgs,
	LoaderFunctionArgs,
	json,
	redirect,
} from '@remix-run/cloudflare';
import { Form, useActionData, useLoaderData } from '@remix-run/react';
import { eq } from 'drizzle-orm';
import { AuthenticityTokenInput } from 'remix-utils/csrf/react';
import { z } from 'zod';
import { ErrorList, Field } from '~/components/forms';
import { Icon } from '~/components/ui/icon';
import { StatusButton } from '~/components/ui/status-button';
import { users } from '~/drizzle/schema.server';
import {
	prepareVerification,
	type VerifyFunctionArgs,
} from '~/routes/_auth+/verify';
import { requireUserId } from '~/utils/auth.server';
import { buildDbClient } from '~/utils/client';
import { validateCSRF } from '~/utils/csrf.server';
import { sendEmail } from '~/utils/email.server';
import { invariant, useIsPending } from '~/utils/misc';
import { redirectWithToast } from '~/utils/toast.server';
import { EmailSchema } from '~/utils/user-validation';
import { verifySessionStorage } from '~/utils/verification.server';

export const handle = {
	breadcrumb: <Icon name='envelope-closed'>Change Email</Icon>,
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- we'll use this below
const newEmailAddressSessionKey = 'new-email-address';

export async function handleVerification({
	request,
	context,
	submission,
}: VerifyFunctionArgs) {
	invariant(submission.value, 'submission.value should be defined by now');

	const verifySession = await verifySessionStorage.getSession(
		request.headers.get('cookie')
	);
	const newEmail = verifySession.get(newEmailAddressSessionKey);
	if (!newEmail) {
		submission.error[''] = [
			'You must submit the code on the same device that requested the email change.',
		];
		return json({ status: 'error', submission } as const, { status: 400 });
	}
	const db = buildDbClient(context);
	const preUpdateUser = await db.query.users.findFirst({
		columns: { email: true },
		where: eq(users.id, submission.value.target),
	});

	if (!preUpdateUser) return null;

	const user = await db
		.update(users)
		.set({
			email: newEmail,
		})
		.where(eq(users.id, submission.value.target))
		.returning({ id: users.id, email: users.email, username: users.username });

	void sendEmail({
		context,
		to: preUpdateUser.email,
		subject: 'Resumaker email changed',
		react: <EmailChangeNoticeEmail userId={user[0].id} />,
	});

	throw await redirectWithToast(
		'/settings/profile',
		{
			title: 'Email Changed',
			type: 'success',
			description: `Your email has been changed to ${user[0].email}`,
		},
		{
			headers: {
				'set-cookie': await verifySessionStorage.destroySession(verifySession),
			},
		}
	);
}

const ChangeEmailSchema = z.object({
	email: EmailSchema,
});

export async function loader({ request, context }: LoaderFunctionArgs) {
	const userId = await requireUserId(request, context);
	const db = buildDbClient(context);
	const user = await db.query.users.findFirst({
		columns: { email: true },
		where: eq(users.id, userId),
	});
	if (!user) {
		const params = new URLSearchParams({ redirectTo: request.url });
		throw redirect(`/login?${params}`);
	}
	return json({ user });
}

export async function action({ request, context }: ActionFunctionArgs) {
	const userId = await requireUserId(request, context);
	const formData = await request.formData();
	await validateCSRF(formData, request.headers);
	const db = buildDbClient(context);

	const submission = await parse(formData, {
		schema: ChangeEmailSchema.superRefine(async (data, ctx) => {
			const existingUser = await db.query.users.findFirst({
				where: eq(users.email, data.email),
			});
			if (existingUser) {
				ctx.addIssue({
					path: ['email'],
					code: 'custom',
					message: 'This email is already in use.',
				});
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

	const { otp, redirectTo, verifyUrl } = await prepareVerification({
		period: 10 * 60,
		request,
		context,
		target: userId,
		type: 'change-email',
	});

	const response = await sendEmail({
		context,
		to: submission.value.email,
		subject: `Resumaker Email Change Verification`,
		react: <EmailChangeEmail verifyUrl={verifyUrl.toString()} otp={otp} />,
	});

	if (response.status === 'success') {
		const verifySession = await verifySessionStorage.getSession(
			request.headers.get('cookie')
		);
		verifySession.set(newEmailAddressSessionKey, submission.value.email);
		return redirect(redirectTo.toString(), {
			headers: {
				'set-cookie': await verifySessionStorage.commitSession(verifySession),
			},
		});
	} else {
		submission.error[''] = [response.error.message];
		return json({ status: 'error', submission } as const, { status: 500 });
	}
}

export function EmailChangeEmail({
	verifyUrl,
	otp,
}: {
	verifyUrl: string;
	otp: string;
}) {
	return (
		<E.Html lang='en' dir='ltr'>
			<E.Container>
				<h1>
					<E.Text>Resumaker Email Change</E.Text>
				</h1>
				<p>
					<E.Text>
						Here&apos;s your verification code: <strong>{otp}</strong>
					</E.Text>
				</p>
				<p>
					<E.Text>Or click the link:</E.Text>
				</p>
				<E.Link href={verifyUrl}>{verifyUrl}</E.Link>
			</E.Container>
		</E.Html>
	);
}

export function EmailChangeNoticeEmail({ userId }: { userId: string }) {
	return (
		<E.Html lang='en' dir='ltr'>
			<E.Container>
				<h1>
					<E.Text>Your Resumaker email has been changed</E.Text>
				</h1>
				<p>
					<E.Text>
						We&apos;re writing to let you know that your Resumaker email has
						been changed.
					</E.Text>
				</p>
				<p>
					<E.Text>
						If you changed your email address, then you can safely ignore this.
						But if you did not change your email address, then please contact
						support immediately.
					</E.Text>
				</p>
				<p>
					<E.Text>Your Account ID: {userId}</E.Text>
				</p>
			</E.Container>
		</E.Html>
	);
}

export default function ChangeEmailIndex() {
	const data = useLoaderData<typeof loader>();
	const actionData = useActionData<typeof action>();

	const [form, fields] = useForm({
		id: 'change-email-form',
		constraint: getFieldsetConstraint(ChangeEmailSchema),
		lastSubmission: actionData?.submission,
		onValidate({ formData }) {
			return parse(formData, { schema: ChangeEmailSchema });
		},
	});

	const isPending = useIsPending();
	return (
		<div>
			<h1 className='text-h1'>Change Email</h1>
			<p>You will receive an email at the new email address to confirm.</p>
			<p>
				An email notice will also be sent to your old address {data.user.email}.
			</p>
			<div className='mx-auto mt-5 max-w-sm'>
				<Form method='POST' {...form.props}>
					<AuthenticityTokenInput />
					<Field
						labelProps={{ children: 'New Email' }}
						inputProps={conform.input(fields.email)}
						errors={fields.email.errors}
					/>
					<ErrorList id={form.errorId} errors={form.errors} />
					<div>
						<StatusButton
							status={isPending ? 'pending' : actionData?.status ?? 'idle'}
						>
							Send Confirmation
						</StatusButton>
					</div>
				</Form>
			</div>
		</div>
	);
}
