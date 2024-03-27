import { generateTOTP } from '@epic-web/totp';
import {
	ActionFunctionArgs,
	LoaderFunctionArgs,
	json,
	redirect,
} from '@remix-run/cloudflare';
import { Link, Form, useLoaderData } from '@remix-run/react';
import { AuthenticityTokenInput } from 'remix-utils/csrf/react';
import { Icon } from '~/components/ui/icon';
import { StatusButton } from '~/components/ui/status-button';
import { requireUserId } from '~/utils/auth.server';
import { validateCSRF } from '~/utils/csrf.server';
import { useIsPending } from '~/utils/misc';
import { buildDbClient } from '~/utils/client';
import { verifications } from '~/drizzle/schema.server';
import { createId } from '@paralleldrive/cuid2';
import { and, eq } from 'drizzle-orm';
import { twoFAVerificationType } from '../_layout';
import { twoFAVerifyVerificationType } from '../verify/_route';

export async function loader({ request, context }: LoaderFunctionArgs) {
	const userId = await requireUserId(request, context);
	const db = buildDbClient(context);
	const verification = await db.query.verifications.findFirst({
		columns: { id: true },
		where: and(
			eq(verifications.type, twoFAVerificationType),
			eq(verifications.target, userId)
		),
	});
	return json({ isTwoFAEnabled: Boolean(verification) });
}

export async function action({ request, context }: ActionFunctionArgs) {
	const userId = await requireUserId(request, context);
	const formData = await request.formData();
	await validateCSRF(formData, request.headers);
	const { otp: _otp, ...config } = generateTOTP();
	const verificationData = {
		...config,
		type: twoFAVerifyVerificationType,
		target: userId,
		expiresAt: new Date(Date.now() + 1000 * 60 * 10),
	};
	const db = buildDbClient(context);

	await db
		.insert(verifications)
		.values({ id: createId(), ...verificationData })
		.onConflictDoUpdate({
			target: [verifications.target, verifications.type],
			set: { ...verificationData },
			where: and(
				eq(verifications.type, twoFAVerifyVerificationType),
				eq(verifications.target, userId)
			),
		});
	return redirect('/dashboard/settings/profile/two-factor/verify');
}

export default function TwoFactorRoute() {
	const data = useLoaderData<typeof loader>();
	const isPending = useIsPending();

	return (
		<div className='flex flex-col gap-4'>
			{data.isTwoFAEnabled ? (
				<>
					<p className='text-lg'>
						<Icon name='check'>
							You have enabled two-factor authentication.
						</Icon>
					</p>
					<Link to='disable'>
						<Icon name='lock-open-1'>Disable 2FA</Icon>
					</Link>
				</>
			) : (
				<>
					<p>
						<Icon name='lock-open-1'>
							You have not enabled two-factor authentication yet.
						</Icon>
					</p>
					<p className='text-sm'>
						Two factor authentication adds an extra layer of security to your
						account. You will need to enter a code from an authenticator app
						like{' '}
						<a className='underline' href='https://1password.com/'>
							1Password
						</a>{' '}
						to log in.
					</p>
					<Form method='POST'>
						<AuthenticityTokenInput />
						<StatusButton
							type='submit'
							name='intent'
							value='enable'
							status={isPending ? 'pending' : 'idle'}
							disabled={isPending}
							className='mx-auto'
						>
							Enable 2FA
						</StatusButton>
					</Form>
				</>
			)}
		</div>
	);
}
