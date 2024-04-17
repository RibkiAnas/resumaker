import { json } from '@remix-run/cloudflare';
import { Outlet } from '@remix-run/react';
import { Footer } from '~/components/home/footer';
import Header from '~/components/home/header';

export async function loader() {
	return json({});
}

function Layout() {
	return (
		<div>
			<Header />
			<main className='bg-page-gradient pt-navigation-height'>
				<Outlet />
			</main>
			<Footer />
		</div>
	);
}

export default Layout;
