/* eslint-disable no-mixed-spaces-and-tabs */
import { cssBundleHref } from '@remix-run/css-bundle';
import {
	Links,
	LiveReload,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration,
	useFetchers,
	useLoaderData,
} from '@remix-run/react';
import {
	ActionFunctionArgs,
	LinksFunction,
	LoaderFunctionArgs,
	MetaFunction,
	json,
} from '@remix-run/cloudflare';
import { parse } from '@conform-to/zod';
import { z } from 'zod';
import { Toaster, toast as showToast } from 'sonner';
import { useEffect } from 'react';
import { eq } from 'drizzle-orm';
import { AuthenticityTokenProvider } from 'remix-utils/csrf/react';
import faviconAssetUrl from './assets/logo-white-32x32.png';
import fontStylessheetUrl from './styles/font.css';
import stylesheetUrl from './styles/globals.css';
import { getEnv } from './utils/env.server';
import { GeneralErrorBoundary } from './components/error-boundary';
import { type Theme, getTheme, setTheme } from './utils/theme.server';
import { combineHeaders, invariantResponse } from './utils/misc';
import { Toast, getToast } from './utils/toast.server';
import { buildDbClient } from './utils/client';
import { users } from './drizzle/schema.server';
import { useOptionalUser } from './utils/user';
import { csrf } from './utils/csrf.server';
import { getUserId } from './utils/auth.server';

export const links: LinksFunction = () => {
	return [
		{ rel: 'icon', href: faviconAssetUrl },
		{ rel: 'stylesheet', href: fontStylessheetUrl },
		{ rel: 'stylesheet', href: stylesheetUrl },
		cssBundleHref
			? { rel: 'stylesheet', href: cssBundleHref }
			: { rel: '', href: '' },
	].filter(Boolean);
};

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
			ENV: getEnv(),
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

function Document({
	children,
	theme,
}: // isLoggedIn = false,
{
	children: React.ReactNode;
	theme?: Theme;
	env?: Record<string, string>;
	isLoggedIn?: boolean;
}) {
	return (
		<html lang='en' className={`${theme} h-full overflow-x-hidden`}>
			<head>
				<Meta />
				<meta charSet='utf-8' />
				<meta name='viewport' content='width=device-width, initial-scale=1' />
				<Links />
			</head>
			<body>
				{children}
				{/* {isLoggedIn ? <LogoutTimer /> : null} */}
				<Toaster closeButton position='top-center' />
				<ScrollRestoration />
				<Scripts />
				<LiveReload />
			</body>
		</html>
	);
}

function App() {
	const data = useLoaderData<typeof loader>();
	const theme = useTheme();
	const user = useOptionalUser();

	return (
		<Document isLoggedIn={Boolean(user)} theme={theme} env={data.ENV}>
			<Outlet />
			{data.toast ? <ShowToast toast={data.toast} /> : null}
		</Document>
	);
}

export default function AppWithProviders() {
	const data = useLoaderData<typeof loader>();
	return (
		<AuthenticityTokenProvider token={data.csrfToken}>
			<App />
		</AuthenticityTokenProvider>
	);
}

function useTheme() {
	const data = useLoaderData<typeof loader>();
	const fetchers = useFetchers();
	const themeFetcher = fetchers.find(
		(fetcher) => fetcher.formData?.get('intent') === 'update-theme'
	);
	const optimisticTheme = themeFetcher?.formData?.get('theme');
	if (optimisticTheme === 'light' || optimisticTheme === 'dark') {
		return optimisticTheme;
	}
	return data.theme;
}

function ShowToast({ toast }: { toast: Toast }) {
	const { id, type, title, description } = toast;
	useEffect(() => {
		setTimeout(() => {
			showToast[type](title, { id, description });
		}, 0);
	}, [description, id, title, type]);
	return null;
}

export const meta: MetaFunction = () => {
	return [
		{ title: 'Resumaker' },
		{ name: 'description', content: `Your own resume builder` },
	];
};

export function ErrorBoundary() {
	return (
		<Document>
			<div className='flex-1'>
				<GeneralErrorBoundary />
			</div>
		</Document>
	);
}
