import { json, type LoaderFunctionArgs } from '@remix-run/cloudflare';
import { Link, Outlet, useLoaderData, useLocation } from '@remix-run/react';
import { and, eq, gt } from 'drizzle-orm';
import { buttonVariants } from '~/components/ui/button';
import { Icon } from '~/components/ui/icon';
import { Separator } from '~/components/ui/separator';
import { sessions, users, verifications } from '~/drizzle/schema.server';
import { requireUserId } from '~/utils/auth.server';
import { buildDbClient } from '~/utils/client';
import { cn, invariantResponse } from '~/utils/misc';
import { twoFAVerificationType } from './two-factor/_layout';

export const handle = {
	breadcrumb: <Icon name='file-text'>Edit Profile</Icon>,
};

export async function loader({ request, context }: LoaderFunctionArgs) {
	const userId = await requireUserId(request, context);
	const db = buildDbClient(context);

	const user = await db.query.users.findFirst({
		columns: {
			id: true,
			name: true,
			username: true,
			email: true,
		},
		with: {
			image: {
				columns: { id: true },
			},
			sessions: {
				where: gt(sessions.expirationDate, new Date()),
			},
		},
		where: eq(users.id, userId),
	});

	invariantResponse(user, 'User not found', { status: 404 });

	const twoFactorVerification = await db.query.verifications.findFirst({
		columns: { id: true },
		where: and(
			eq(verifications.type, twoFAVerificationType),
			eq(verifications.target, userId)
		),
	});

	return json({ user, isTwoFAEnabled: Boolean(twoFactorVerification) });
}

function Layout() {
	const data = useLoaderData<typeof loader>();
	const location = useLocation();

	return (
		<div className='space-y-6 md:block'>
			<div className='space-y-0.5'>
				<h2 className='text-2xl font-bold tracking-tight'>Settings</h2>
				<p className='text-muted-foreground text-sm'>
					Manage your account settings and set e-mail preferences.
				</p>
			</div>
			<Separator className='my-6' />
			<div className='flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0'>
				<aside className='lg:-mx-4 lg:w-1/5'>
					<nav className='flex flex-wrap space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1'>
						<Link
							to='/dashboard/settings/profile'
							className={cn(
								buttonVariants({ variant: 'ghost' }),
								location?.pathname === '/dashboard/settings/profile'
									? 'bg-muted'
									: 'hover:bg-transparent hover:underline',
								'justify-start'
							)}
						>
							Change your profile
						</Link>
						<Link
							to='change-email'
							className={cn(
								buttonVariants({ variant: 'ghost' }),
								location?.pathname ===
									'/dashboard/settings/profile/change-email'
									? 'bg-muted'
									: 'hover:bg-transparent hover:underline',
								'justify-start'
							)}
						>
							Change email from {data.user.email}
						</Link>
						<Link
							to='two-factor'
							className={cn(
								buttonVariants({ variant: 'ghost' }),
								location?.pathname === '/dashboard/settings/profile/two-factor'
									? 'bg-muted'
									: 'hover:bg-transparent hover:underline',
								'justify-start'
							)}
						>
							{data.isTwoFAEnabled ? '2FA is enabled' : 'Enable 2FA'}
						</Link>
						<Link
							to='password'
							className={cn(
								buttonVariants({ variant: 'ghost' }),
								location?.pathname === '/dashboard/settings/profile/password'
									? 'bg-muted'
									: 'hover:bg-transparent hover:underline',
								'justify-start'
							)}
						>
							Change Password
						</Link>
						<Link
							to='connections'
							className={cn(
								buttonVariants({ variant: 'ghost' }),
								location?.pathname === '/dashboard/settings/profile/connections'
									? 'bg-muted'
									: 'hover:bg-transparent hover:underline',
								'justify-start'
							)}
						>
							Manage connections
						</Link>
						<a
							download='my-resume-data.json'
							href='/resources/download-user-data'
							className={cn(
								buttonVariants({ variant: 'ghost' }),
								location?.pathname === '/resources/download-user-data'
									? 'bg-muted'
									: 'hover:bg-transparent hover:underline',
								'justify-start'
							)}
						>
							Download your data
						</a>
					</nav>
				</aside>
				<div className='flex-1 lg:max-w-2xl'>
					<Outlet />
				</div>
			</div>
		</div>
	);
}

export default Layout;
