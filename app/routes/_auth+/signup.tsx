import * as E from '@react-email/components';
import { LoaderFunctionArgs, MetaFunction, json } from '@remix-run/cloudflare';
import { useSearchParams } from '@remix-run/react';
import { requireAnonymous } from '~/utils/auth.server';
import { GeneralErrorBoundary } from '~/components/error-boundary';
import { ProviderConnectionForm } from '~/utils/connections';

export async function loader({ request, context }: LoaderFunctionArgs) {
	await requireAnonymous(request, context);
	return json({});
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
					<E.Text>Welcome to Resumaker!</E.Text>
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
	const [searchParams] = useSearchParams();
	const redirectTo = searchParams.get('redirectTo');

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
	return [{ title: 'Sign Up | Resumaker' }];
};

export function ErrorBoundary() {
	return <GeneralErrorBoundary />;
}
