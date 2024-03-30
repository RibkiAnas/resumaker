import { conform, useForm } from '@conform-to/react';
import { getFieldsetConstraint, parse } from '@conform-to/zod';
import { getTOTPAuthUri } from '@epic-web/totp';
import {
	ActionFunctionArgs,
	LoaderFunctionArgs,
	json,
	redirect,
} from '@remix-run/cloudflare';
import {
	Form,
	useActionData,
	useLoaderData,
	useNavigation,
} from '@remix-run/react';
import { and, eq } from 'drizzle-orm';
import { AuthenticityTokenInput } from 'remix-utils/csrf/react';
import { z } from 'zod';
import { Field } from '~/components/forms';
import { Icon } from '~/components/ui/icon';
import { StatusButton } from '~/components/ui/status-button';
import { users, verifications } from '~/drizzle/schema.server';
import { requireUserId } from '~/utils/auth.server';
import { buildDbClient } from '~/utils/client';
import { validateCSRF } from '~/utils/csrf.server';
import { getDomainUrl, invariantResponse, useIsPending } from '~/utils/misc';
import { redirectWithToast } from '~/utils/toast.server';
import { isCodeValid } from '../../../../../../_auth+/verify';
import { twoFAVerificationType } from '../_layout';
// import * as QRCode from "qrcode";

export const handle = {
	breadcrumb: <Icon name='check'>Verify</Icon>,
};

const VerifySchema = z.object({
	code: z.string().min(6).max(6),
});

export const twoFAVerifyVerificationType = '2fa-verify';

export async function loader({ request, context }: LoaderFunctionArgs) {
	const userId = await requireUserId(request, context);
	const db = buildDbClient(context);
	const verification = await db.query.verifications.findFirst({
		columns: {
			id: true,
			algorithm: true,
			secret: true,
			period: true,
			digits: true,
		},
		where: and(
			eq(verifications.type, twoFAVerifyVerificationType),
			eq(verifications.target, userId)
		),
	});
	if (!verification) {
		return redirect('/dashboard/settings/profile/two-factor');
	}
	const user = await db.query.users.findFirst({
		columns: {
			email: true,
		},
		where: eq(users.id, userId),
	});
	invariantResponse(user?.email, 'Email not found');
	const issuer = new URL(getDomainUrl(request)).host;
	const otpUri = getTOTPAuthUri({
		...verification,
		accountName: user.email,
		issuer,
	});
	// const qrCode = await QRCode.toDataURL(otpUri);
	return json({ otpUri });
}

export async function action({ request, context }: ActionFunctionArgs) {
	const userId = await requireUserId(request, context);
	const formData = await request.formData();
	await validateCSRF(formData, request.headers);
	const db = buildDbClient(context);

	if (formData.get('intent') === 'cancel') {
		await db
			.delete(verifications)
			.where(
				and(
					eq(verifications.target, userId),
					eq(verifications.type, twoFAVerifyVerificationType)
				)
			);
		return redirect('/dashboard/settings/profile/two-factor');
	}
	const submission = await parse(formData, {
		schema: () =>
			VerifySchema.superRefine(async (data, ctx) => {
				const codeIsValid = await isCodeValid({
					context,
					code: data.code,
					type: twoFAVerifyVerificationType,
					target: userId,
				});
				if (!codeIsValid) {
					ctx.addIssue({
						path: ['code'],
						code: z.ZodIssueCode.custom,
						message: `Invalid code`,
					});
					return z.NEVER;
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

	await db
		.update(verifications)
		.set({
			type: twoFAVerificationType,
			expiresAt: null,
		})
		.where(
			and(
				eq(verifications.type, twoFAVerifyVerificationType),
				eq(verifications.target, userId)
			)
		);

	throw await redirectWithToast('/dashboard/settings/profile/two-factor', {
		type: 'success',
		title: 'Enabled',
		description: 'Two-factor authentication has been enabled.',
	});
}

export default function TwoFactorRoute() {
	const data = useLoaderData<typeof loader>();
	const actionData = useActionData<typeof action>();
	const navigation = useNavigation();

	const isPending = useIsPending();
	const pendingIntent = isPending ? navigation.formData?.get('intent') : null;

	const [form, fields] = useForm({
		id: 'verify-form',
		constraint: getFieldsetConstraint(VerifySchema),
		lastSubmission: actionData?.submission,
		onValidate({ formData }) {
			return parse(formData, { schema: VerifySchema });
		},
	});

	return (
		<div>
			<div className='flex flex-col items-center gap-4'>
				<img
					alt='qr code'
					src={`https://api.qrserver.com/v1/create-qr-code/?data=${data.otpUri}`}
					className='h-56 w-56'
				/>
				<p className='text-sm'>
					Scan this QR code with your authenticator app.
				</p>
				<p className='text-sm'>
					If you cannot scan the QR code, you can manually add this account to
					your authenticator app using this code:
				</p>
				<div className='p-3'>
					<pre
						className='whitespace-pre-wrap break-all text-sm'
						aria-label='One-time Password URI'
					>
						{data.otpUri}
					</pre>
				</div>
				<p className='text-sm'>
					Once you&apos;ve added the account, enter the code from your
					authenticator app below. Once you enable 2FA, you will need to enter a
					code from your authenticator app every time you log in or perform
					important actions. Do not lose access to your authenticator app, or
					you will lose access to your account.
				</p>
				<div className='flex w-full max-w-xs flex-col justify-center gap-4'>
					<Form method='POST' {...form.props} className='space-y-8'>
						<AuthenticityTokenInput />
						<div className='space-y-2'>
							<Field
								labelProps={{
									htmlFor: fields.code.id,
									children: 'Code',
								}}
								inputProps={{ ...conform.input(fields.code), autoFocus: true }}
								errors={fields.code.errors}
							/>
						</div>
						<div className='flex justify-between gap-4'>
							<StatusButton
								className='w-full'
								status={
									pendingIntent === 'verify'
										? 'pending'
										: actionData?.status ?? 'idle'
								}
								type='submit'
								name='intent'
								value='verify'
								disabled={isPending}
							>
								Submit
							</StatusButton>
							<StatusButton
								className='w-full'
								variant='secondary'
								status={pendingIntent === 'cancel' ? 'pending' : 'idle'}
								type='submit'
								name='intent'
								value='cancel'
								disabled={isPending}
							>
								Cancel
							</StatusButton>
						</div>
					</Form>
				</div>
			</div>
		</div>
	);
}
