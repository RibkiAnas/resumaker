import { useEffect, useState } from 'react';
import Container from './container';
import { Link } from '@remix-run/react';
import Logo from '../../assets/logo-black-256x256.png';

function Header() {
	const [hamburgerMenuIsOpen, setHamburgerMenuIsOpen] = useState(false);

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
			</Container>
		</header>
	);
}

export default Header;
