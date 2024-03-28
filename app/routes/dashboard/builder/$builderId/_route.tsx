import { json, LoaderFunctionArgs } from '@remix-run/cloudflare';
import { useLoaderData } from '@remix-run/react';
import { eq } from 'drizzle-orm';
import ResumeBuilder from '~/components/builder/resume-builder';
import { users } from '~/drizzle/schema.server';
import { requireUser } from '~/utils/auth.server';
import { buildDbClient } from '~/utils/client';
import { invariantResponse } from '~/utils/misc';
import { useOptionalUser } from '~/utils/user';

export const loader = async ({ request, context }: LoaderFunctionArgs) => {
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
};

function BuilderPage() {
	const data = useLoaderData<typeof loader>();
	const user = data.user;
	const loggedInUser = useOptionalUser();
	const isLoggedInUser = user.id === loggedInUser?.id;

	return <ResumeBuilder isLoggedInUser={isLoggedInUser} />;
}

export default BuilderPage;
