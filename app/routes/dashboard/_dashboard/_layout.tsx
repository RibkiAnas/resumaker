import { json, LoaderFunctionArgs } from '@remix-run/cloudflare';
import { Form, Link, Outlet, useLoaderData } from '@remix-run/react';
import { CircleUser, FileText, Menu, Settings2 } from 'lucide-react';

import { Button } from '~/components/ui/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '~/components/ui/sheet';
import { requireUser } from '~/utils/auth.server';
import Logo from '../../../assets/logo-black-256x256.png';
import { AuthenticityTokenInput } from 'remix-utils/csrf/react';
import { useOptionalUser } from '~/utils/user';
import { buildDbClient } from '~/utils/client';
import { eq } from 'drizzle-orm';
import { users } from '~/drizzle/schema.server';
import { invariantResponse } from '~/utils/misc';

export async function loader({ request, context }: LoaderFunctionArgs) {
	const { id } = await requireUser(request, context);
	const db = buildDbClient(context);
	const user = await db.query.users.findFirst({
		columns: {
			id: true,
			name: true,
			username: true,
			createdAt: true,
		},
		with: {
			image: {
				columns: {
					id: true,
				},
			},
		},
		where: eq(users.id, id),
	});

	invariantResponse(user, 'User not found', { status: 404 });

	return json({
		user,
	});
}

function BuilderLayout() {
	const data = useLoaderData<typeof loader>();
	const user = data.user;
	const loggedInUser = useOptionalUser();
	const isLoggedInUser = user.id === loggedInUser?.id;
	return (
		<div className='grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]'>
			<div className='hidden border-r bg-muted/40 md:block'>
				<div className='flex h-full max-h-screen flex-col gap-2'>
					<div className='flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6'>
						<Link
							to='/'
							className='flex items-center gap-2 font-semibold text-md'
						>
							<img src={Logo} alt='logo' className='h-6 w-6' />
							<span className=''>Resumaker</span>
						</Link>
					</div>
					<div className='flex-1'>
						<nav className='grid items-start px-2 text-sm font-medium lg:px-4'>
							<Link
								to='/dashboard/resumes'
								className='flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary'
							>
								<FileText className='h-4 w-4' />
								Resumes
							</Link>
							<Link
								to='/dashboard/settings/profile'
								className='flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary'
							>
								<Settings2 className='h-4 w-4' />
								Settings
							</Link>
						</nav>
					</div>
				</div>
			</div>
			<div className='flex flex-col'>
				<header className='flex h-14 items-center justify-between gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6'>
					<Sheet>
						<SheetTrigger asChild>
							<Button
								variant='outline'
								size='icon'
								className='shrink-0 md:hidden'
							>
								<Menu className='h-5 w-5' />
								<span className='sr-only'>Toggle navigation menu</span>
							</Button>
						</SheetTrigger>
						<SheetContent side='left' className='flex flex-col'>
							<nav className='grid gap-2 text-lg font-medium'>
								<Link
									to='#'
									className='flex items-center gap-2 text-lg font-semibold'
								>
									<img src={Logo} alt='logo' className='h-6 w-6' />
									<span className='sr-only'>Resumaker</span>
								</Link>
								<Link
									to='/dashboard/resumes'
									className='mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground'
								>
									<FileText className='h-5 w-5' />
									Resumes
								</Link>
								<Link
									to='/dashboard/settings'
									className='mx-[-0.65rem] flex items-center gap-4 rounded-xl bg-muted px-3 py-2 text-foreground hover:text-foreground'
								>
									<Settings2 className='h-5 w-5' />
									Settings
								</Link>
							</nav>
						</SheetContent>
					</Sheet>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant='secondary' size='icon' className='rounded-full'>
								<CircleUser className='h-5 w-5' />
								<span className='sr-only'>Toggle user menu</span>
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align='end'>
							<DropdownMenuLabel>My Account</DropdownMenuLabel>
							<DropdownMenuSeparator />
							<DropdownMenuItem>
								<Link to='/dashboard/settings/profile'>Settings</Link>
							</DropdownMenuItem>
							<DropdownMenuSeparator />
							<DropdownMenuItem>
								{isLoggedInUser ? (
									<Form action='/logout' method='POST'>
										<AuthenticityTokenInput />
										<button type='submit'>Logout</button>
									</Form>
								) : null}
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</header>
				<main className='flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6'>
					<Outlet />
				</main>
			</div>
		</div>
	);
}

export default BuilderLayout;
