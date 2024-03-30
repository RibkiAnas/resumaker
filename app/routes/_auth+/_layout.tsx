import { Link, Outlet, useMatches, useNavigation } from '@remix-run/react';
import { buttonVariants } from '~/components/ui/button';
import { cn } from '~/lib/utils';
import Logo from '../../assets/logo-white-256x256.png';

function AuthLayout() {
	const { location } = useNavigation();
	const matches = useMatches();
	const isLoginPage = matches.find((m) => m.id === 'routes/_auth+/login');
	const isSignupPage = matches.find((m) => m.id === 'routes/_auth+/signup');

	console.log(location?.pathname);

	return (
		<div className='container relative h-[100vh] flex flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0'>
			<Link
				to={isLoginPage ? '/signup' : '/login'}
				className={cn(
					buttonVariants({ variant: 'ghost' }),
					'absolute right-4 top-4 md:right-8 md:top-8'
				)}
			>
				{isLoginPage ? 'Signup' : 'Login'}
			</Link>
			<div className='relative hidden h-full flex-col bg-muted p-10 text-white lg:flex dark:border-r'>
				<div className='absolute inset-0 bg-zinc-900' />
				<div className='relative z-20 flex items-center text-lg font-medium'>
					<Link to='/' className='flex items-center'>
						<img src={Logo} alt='logo' className='mr-2 h-6 w-6' /> Resumaker
					</Link>
				</div>
			</div>
			<div className='p-8'>
				<div className='mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px] mt-4'>
					<Outlet />
					{isLoginPage || isSignupPage ? (
						<p className='px-8 text-center text-sm text-muted-foreground'>
							By clicking continue, you agree to our{' '}
							<Link
								to='#'
								className='underline underline-offset-4 hover:text-primary'
							>
								Terms of Service
							</Link>{' '}
							and{' '}
							<Link
								to='#'
								className='underline underline-offset-4 hover:text-primary'
							>
								Privacy Policy
							</Link>
							.
						</p>
					) : null}
				</div>
			</div>
		</div>
	);
}

export default AuthLayout;
