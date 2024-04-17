import { json } from '@remix-run/cloudflare';
import { Outlet } from '@remix-run/react';

export async function loader() {
	return json({});
}

function BuilderLayout() {
	return (
		<div className='flex flex-col'>
			<Outlet />
		</div>
	);
}

export default BuilderLayout;
