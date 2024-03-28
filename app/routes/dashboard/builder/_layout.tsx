import { json, LoaderFunctionArgs } from '@remix-run/cloudflare';
import { Outlet } from '@remix-run/react';
import { eq } from 'drizzle-orm';
import { resumes } from '~/drizzle/schema.server';
import { requireUser } from '~/utils/auth.server';
import { buildDbClient } from '~/utils/client';
import { invariantResponse } from '~/utils/misc';

export async function loader({ request, context, params }: LoaderFunctionArgs) {
	await requireUser(request, context);
	const db = buildDbClient(context);
	const resume = await db.query.resumes.findFirst({
		columns: {
			id: true,
		},
		where: eq(resumes.id, params.builderId as string),
	});

	invariantResponse(resume, 'Resume not found', { status: 404 });

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
