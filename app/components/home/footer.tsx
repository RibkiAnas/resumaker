import { Link } from '@remix-run/react';
import Container from './container';
import Logo from '../../assets/logo-black-256x256.png';

export const Footer = () => {
	return (
		<footer className='border-t border-transparent-white backdrop-blur-[12px]'>
			<Container className='flex flex-col items-center justify-between md:flex-row  h-navigation-height py-2'>
				<Link to='/' className='flex items-center text-md'>
					<img src={Logo} alt='logo' className='mr-2 h-6 w-6' /> Resumaker
				</Link>
				<p className='inline-flex min-h-11 items-center text-xs'>
					© {new Date().getFullYear()} Resumaker. All rights reserved.
				</p>
			</Container>
		</footer>
	);
};
