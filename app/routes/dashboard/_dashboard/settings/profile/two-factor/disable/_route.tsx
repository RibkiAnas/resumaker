import {
	ActionFunctionArgs,
	AppLoadContext,
	LoaderFunctionArgs,
	json,
} from '@remix-run/cloudflare';
import { Form } from '@remix-run/react';
import { and, eq } from 'drizzle-orm';
import { AuthenticityTokenInput } from 'remix-utils/csrf/react';
import { Icon } from '~/components/ui/icon';
import { StatusButton } from '~/components/ui/status-button';
import { verifications } from '~/drizzle/schema.server';
import { shouldRequestTwoFA } from '~/routes/_auth+/login';
import { getRedirectToUrl } from '~/routes/_auth+/verify';
import { requireUserId } from '~/utils/auth.server';
import { buildDbClient } from '~/utils/client';
import { validateCSRF } from '~/utils/csrf.server';
import { useDoubleCheck, useIsPending } from '~/utils/misc';
import { redirectWithToast } from '~/utils/toast.server';
import { twoFAVerificationType } from '../_layout';

export const handle = {
	breadcrumb: <Icon name='lock-open-1'>Disable</Icon>,
};

export async function requireRecentVerification({
	request,
	context,
	userId,
}: {
	request: Request;
	context: AppLoadContext;
	userId: string;
}) {
	const shouldReverify = await shouldRequestTwoFA({ request, context, userId });
	if (shouldReverify) {
		const reqUrl = new URL(request.url);
		const redirectUrl = getRedirectToUrl({
			request,
			target: userId,
			type: twoFAVerificationType,
			redirectTo: reqUrl.pathname + reqUrl.search,
		});
		throw await redirectWithToast(redirectUrl.toString(), {
			title: 'Please Reverify',
			description: 'Please reverify your account before proceeding',
		});
	}
}

export async function loader({ request, context }: LoaderFunctionArgs) {
	const userId = await requireUserId(request, context);
	await requireRecentVerification({ request, context, userId });
	return json({});
}

export async function action({ request, context }: ActionFunctionArgs) {
	const userId = await requireUserId(request, context);
	await requireRecentVerification({ request, context, userId });
	const formData = await request.formData();
	await validateCSRF(formData, request.headers);
	const db = buildDbClient(context);

	await db
		.delete(verifications)
		.where(
			and(
				eq(verifications.target, userId),
				eq(verifications.type, twoFAVerificationType)
			)
		);
	throw await redirectWithToast('/dashboard/settings/profile/two-factor', {
		title: '2FA Disabled',
		type: 'success',
		description: 'Two factor authentication has been disabled.',
	});
}

export default function TwoFactorDisableRoute() {
	const isPending = useIsPending();
	const dc = useDoubleCheck();

	return (
		<div className='mx-auto max-w-sm'>
			<Form method='POST'>
				<AuthenticityTokenInput />
				<p>
					Disabling two factor authentication is not recommended. However, if
					you would like to do so, click here:
				</p>
				<StatusButton
					variant='destructive'
					status={isPending ? 'pending' : 'idle'}
					disabled={isPending}
					{...dc.getButtonProps({
						className: 'mx-auto',
						name: 'intent',
						value: 'disable',
						type: 'submit',
					})}
				>
					{dc.doubleCheck ? 'Are you sure?' : 'Disable 2FA'}
				</StatusButton>
			</Form>
		</div>
	);
}
