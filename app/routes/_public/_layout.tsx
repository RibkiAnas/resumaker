/* eslint-disable no-mixed-spaces-and-tabs */
import { parse } from '@conform-to/zod';
import {
	ActionFunctionArgs,
	json,
	LoaderFunctionArgs,
} from '@remix-run/cloudflare';
import { Outlet } from '@remix-run/react';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import Header from '~/components/home/header';
import { users } from '~/drizzle/schema.server';
import { getUserId } from '~/utils/auth.server';
import { buildDbClient } from '~/utils/client';
import { csrf } from '~/utils/csrf.server';
import { combineHeaders, invariantResponse } from '~/utils/misc';
import { getTheme, setTheme } from '~/utils/theme.server';
import { getToast } from '~/utils/toast.server';

export async function loader({ request, context }: LoaderFunctionArgs) {
	const [csrfToken, csrfCookieHeader] = await csrf.commitToken(request);
	const { toast, headers: toastHeaders } = await getToast(request);
	const userId = await getUserId(request, context);
	const db = buildDbClient(context);

	const user = userId
		? await db.query.users.findFirst({
				columns: {
					id: true,
					name: true,
					username: true,
				},
				with: {
					image: { columns: { id: true } },
					rolesToUsers: {
						with: {
							role: {
								columns: {
									name: true,
								},
								with: {
									permissionsToRoles: {
										with: {
											permission: {
												columns: {
													entity: true,
													action: true,
													access: true,
												},
											},
										},
									},
								},
							},
						},
					},
				},
				where: eq(users.id, userId),
		  })
		: null;

	return json(
		{
			username: 'Kody',
			user,
			theme: getTheme(request),
			toast,
			csrfToken,
		},
		{
			headers: combineHeaders(
				csrfCookieHeader ? { 'set-cookie': csrfCookieHeader } : null,
				toastHeaders
			),
		}
	);
}

const ThemeFormSchema = z.object({
	theme: z.enum(['light', 'dark']),
});

export async function action({ request }: ActionFunctionArgs) {
	const formData = await request.formData();
	invariantResponse(
		formData.get('intent') === 'update-theme',
		'Invalid intent',
		{ status: 400 }
	);
	const submission = parse(formData, {
		schema: ThemeFormSchema,
	});
	if (submission.intent !== 'submit') {
		return json({ status: 'success', submission } as const);
	}
	if (!submission.value) {
		return json({ status: 'error', submission } as const, { status: 400 });
	}

	const { theme } = submission.value;

	const responseInit = {
		headers: { 'set-cookie': setTheme(theme) },
	};
	return json({ success: true, submission }, responseInit);
}

function Layout() {
	return (
		<div>
			<Header />
			<main className='bg-page-gradient pt-navigation-height'>
				<Outlet />
			</main>
		</div>
	);
}

export default Layout;
