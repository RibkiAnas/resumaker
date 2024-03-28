import { useEffect, useState } from 'react';
import Container from './container';
import { Link } from '@remix-run/react';
import { cn } from '~/lib/utils';
import { Button } from '../ui/button';
import { HamburgerIcon } from '../icons/hamburger';
import Logo from '../../assets/logo-black-256x256.png';
import { useOptionalUser } from '~/utils/user';
import { Icon } from '../ui/icon';
import { getUserImgSrc } from '~/utils/misc';
import { userHasRole } from '~/utils/permissions';

function Header() {
	const [hamburgerMenuIsOpen, setHamburgerMenuIsOpen] = useState(false);

	const user = useOptionalUser();
	const userIsAdmin = userHasRole(user, 'admin');

	useEffect(() => {
		const html = document.querySelector('html');
		if (html) html.classList.toggle('overflow-hidden', hamburgerMenuIsOpen);
	}, [hamburgerMenuIsOpen]);

	useEffect(() => {
		const closeHamburgerNavigation = () => setHamburgerMenuIsOpen(false);

		window.addEventListener('orientationchange', closeHamburgerNavigation);
		window.addEventListener('resize', closeHamburgerNavigation);

		return () => {
			window.removeEventListener('orientationchange', closeHamburgerNavigation);
			window.removeEventListener('resize', closeHamburgerNavigation);
		};
	}, [setHamburgerMenuIsOpen]);

	return (
		<header className='fixed top-0 left-0 z-10 w-full border-b border-transparent-white backdrop-blur-[12px]'>
			<Container className='flex h-navigation-height'>
				<Link to='/' className='flex items-center text-md'>
					<img src={Logo} alt='logo' className='mr-2 h-6 w-6' /> Resumaker
				</Link>

				<div
					className={cn(
						'transition-[visibility] md:visible',
						hamburgerMenuIsOpen ? 'visible' : 'delay-500 invisible'
					)}
				>
					<nav
						className={cn(
							'fixed top-navigation-height left-0 h-[calc(100vh_-_var(--navigation-height))] w-full overflow-auto bg-background transition-opacity duration-500 md:relative md:top-0 md:block md:h-auto md:w-auto md:translate-x-0 md:overflow-hidden md:bg-transparent md:opacity-100 md:transition-none',
							hamburgerMenuIsOpen
								? 'translate-x-0 opacity-100'
								: 'translate-x-[-100vw] opacity-0'
						)}
					>
						<ul
							className={cn(
								'flex h-full flex-col md:flex-row md:items-center [&_li]:ml-6 [&_li]:border-b [&_li]:border-grey-dark md:[&_li]:border-none',
								'ease-in [&_a:hover]:text-grey [&_a]:flex [&_a]:h-navigation-height [&_a]:w-full [&_a]:translate-y-8 [&_a]:items-center [&_a]:text-lg [&_a]:transition-[color,transform] [&_a]:duration-300 md:[&_a]:translate-y-0 md:[&_a]:text-sm [&_a]:md:transition-colors',
								hamburgerMenuIsOpen && '[&_a]:translate-y-0'
							)}
						>
							<li>
								<Link to='#'>Features</Link>
							</li>
							<li>
								<Link to='#'>Method</Link>
							</li>
							<li className='md:hidden lg:block'>
								<Link to='#'>Customers</Link>
							</li>
							<li className='md:hidden lg:block'>
								<Link to='#'>Changelog</Link>
							</li>
							<li className='md:hidden lg:block'>
								<Link to='#'>Integrations</Link>
							</li>
							<li>
								<Link to='#'>Pricing</Link>
							</li>
							<li>
								<Link to='#'>Company</Link>
							</li>
						</ul>
					</nav>
				</div>

				<div className='ml-auto flex h-full items-center'>
					{user ? (
						<div className='flex items-center gap-2'>
							<Button asChild variant='secondary'>
								<Link
									to={`/users/${user.username}`}
									className='flex items-center gap-2'
								>
									<img
										className='h-8 w-8 rounded-full object-cover'
										alt={user.name ?? user.username!}
										src={getUserImgSrc(user.image?.id)}
									/>
									<span className='hidden text-body-sm font-bold sm:block'>
										{user.name ?? user.username}
									</span>
								</Link>
							</Button>
							{userIsAdmin ? (
								<Button asChild variant='secondary'>
									<Link to='/admin'>
										<Icon name='backpack'>
											<span className='hidden sm:block'>Admin</span>
										</Icon>
									</Link>
								</Button>
							) : null}
						</div>
					) : (
						<>
							<Link className='mr-6 text-sm' to={'/login'}>
								Log in
							</Link>
							<Button asChild size='sm' className='rounded-lg'>
								<Link to={'/signup'}>Sign up</Link>
							</Button>
						</>
					)}
				</div>

				<button
					className='ml-6 md:hidden'
					onClick={() => setHamburgerMenuIsOpen((open) => !open)}
				>
					<span className='sr-only'>Toggle menu</span>
					<HamburgerIcon />
				</button>
			</Container>
		</header>
	);
}

export default Header;
