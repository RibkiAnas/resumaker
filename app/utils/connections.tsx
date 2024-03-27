import { Form } from '@remix-run/react';
import { z } from 'zod';
import { Icon } from '~/components/ui/icon';
import { StatusButton } from '~/components/ui/status-button';
import { useIsPending } from './misc';

const GITHUB_PROVIDER_NAME = 'github';
// to add another provider, set their name here and add it to the providerNames below

export const providerNames = [GITHUB_PROVIDER_NAME] as const;
export const ProviderNameSchema = z.enum(providerNames);
export type ProviderName = z.infer<typeof ProviderNameSchema>;

export const providerLabels: Record<ProviderName, string> = {
	[GITHUB_PROVIDER_NAME]: 'GitHub',
} as const;

export const providerIcons: Record<ProviderName, React.ReactNode> = {
	[GITHUB_PROVIDER_NAME]: <Icon name='github-logo' />,
} as const;

export function ProviderConnectionForm({
	redirectTo,
	providerName,
}: {
	redirectTo?: string | null;
	type: 'Connect' | 'Login' | 'Signup';
	providerName: ProviderName;
}) {
	const label = providerLabels[providerName];
	const formAction = `/auth/${providerName}`;
	const isPending = useIsPending({ formAction });
	return (
		<Form
			className='flex items-center justify-center gap-2'
			action={formAction}
			method='POST'
		>
			{redirectTo ? (
				<input type='hidden' name='redirectTo' value={redirectTo} />
			) : null}
			<StatusButton
				type='submit'
				className='w-full'
				status={isPending ? 'pending' : 'idle'}
			>
				<span className='inline-flex items-center gap-1'>
					{providerIcons[providerName]}
					<span>{label}</span>
				</span>
			</StatusButton>
		</Form>
	);
}
