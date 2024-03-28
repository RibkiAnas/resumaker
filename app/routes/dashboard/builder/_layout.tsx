import { json, LoaderFunctionArgs } from '@remix-run/cloudflare';
import { Outlet } from '@remix-run/react';
import { requireUser } from '~/utils/auth.server';

export async function loader({ request, context }: LoaderFunctionArgs) {
	await requireUser(request, context);
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
