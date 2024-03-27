import { flatRoutes } from 'remix-flat-routes';

/** @type {import('@remix-run/dev').AppConfig} */
export default {
	ignoredRouteFiles: ['**/.*'],
	server: './server.ts',
	serverBuildPath: 'functions/[[path]].js',
	serverConditions: ['workerd', 'worker', 'browser'],
	serverDependenciesToBundle: 'all',
	serverMainFields: ['browser', 'module', 'main'],
	serverMinify: true,
	serverModuleFormat: 'esm',
	serverPlatform: 'neutral',
	tailwind: true,
	postcss: true,
	watchPaths: ['./tailwind.config.ts'],
	// appDirectory: "app",
	// assetsBuildDirectory: "public/build",
	// publicPath: "/build/",
	routes: async (defineRoutes) => {
		return flatRoutes('routes', defineRoutes, {
			ignoredRouteFiles: [
				'.*',
				'**/*.css',
				'**/*.test.{js,jsx,ts,tsx}',
				'**/__*.*',
			],
		});
	},
	serverNodeBuiltinsPolyfill: {
		modules: {
			crypto: true,
			path: true,
			os: true,
			buffer: true,
			'fs/promises': 'empty',
			fs: 'empty',
			process: true,
		},
		globals: {
			Buffer: true,
		},
	},
	browserNodeBuiltinsPolyfill: {
		modules: {
			crypto: true,
			process: true,
		},
	},
};
