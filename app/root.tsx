import { cssBundleHref } from '@remix-run/css-bundle';
import {
	Links,
	LiveReload,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration,
} from '@remix-run/react';
import { LinksFunction, MetaFunction, json } from '@remix-run/cloudflare';
import faviconAssetUrl from './assets/logo-white-32x32.png';
import fontStylessheetUrl from './styles/font.css';
import stylesheetUrl from './styles/globals.css';
import { GeneralErrorBoundary } from './components/error-boundary';
import remixImageStyles from 'remix-image/remix-image.css';

export const links: LinksFunction = () => {
	return [
		{ rel: 'icon', href: faviconAssetUrl },
		{ rel: 'stylesheet', href: fontStylessheetUrl },
		{ rel: 'stylesheet', href: stylesheetUrl },
		{ rel: 'stylesheet', href: remixImageStyles },
		cssBundleHref
			? { rel: 'stylesheet', href: cssBundleHref }
			: { rel: '', href: '' },
	].filter(Boolean);
};

export async function loader() {
	return json({});
}

function Document({ children }: { children: React.ReactNode }) {
	return (
		<html lang='en' className={`h-full overflow-x-hidden`}>
			<head>
				<Meta />
				<meta charSet='utf-8' />
				<meta name='viewport' content='width=device-width, initial-scale=1' />
				<Links />
			</head>
			<body>
				{children}
				<ScrollRestoration />
				<Scripts />
				<LiveReload />
			</body>
		</html>
	);
}

function App() {
	return (
		<Document>
			<Outlet />
		</Document>
	);
}

export default function AppWithProviders() {
	return (
		<>
			<App />
		</>
	);
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
