import { json, LoaderFunctionArgs } from '@remix-run/cloudflare';
import { useLoaderData } from '@remix-run/react';
import { eq } from 'drizzle-orm';
import { Provider } from 'react-redux';
import ResumeBuilder from '~/components/builder/resume-builder';
import { resumes, users } from '~/drizzle/schema.server';
import { store } from '~/lib/redux/store';
import { requireUser } from '~/utils/auth.server';
import { buildDbClient } from '~/utils/client';
import { invariantResponse } from '~/utils/misc';

export const loader = async ({
	request,
	context,
	params,
}: LoaderFunctionArgs) => {
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
			resumes: {
				columns: {
					title: true,
					content: true,
				},
			},
		},
		where: eq(users.id, id),
	});

	const resume = await db.query.resumes.findFirst({
		columns: {
			id: true,
			content: true,
			title: true,
		},
		where: eq(resumes.id, params.builderId as string),
	});

	invariantResponse(user, 'User not found', { status: 404 });

	return json({
		user,
		resume,
	});
};

function BuilderPage() {
	const data = useLoaderData();

	return (
		<Provider store={store}>
			<ResumeBuilder resume={data?.resume} />
		</Provider>
	);
}

export default BuilderPage;
