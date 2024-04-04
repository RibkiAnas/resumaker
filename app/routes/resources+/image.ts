import type { LoaderFunction, LoaderFunctionArgs } from '@remix-run/cloudflare';
import {
	imageLoader,
	MemoryCache,
	pureTransformer,
} from 'remix-image/serverPure';

const SELF_URL = 'http://localhost:8788';

export const loader: LoaderFunction = ({ request }: LoaderFunctionArgs) => {
	const config = {
		selfUrl: SELF_URL,
		cache: new MemoryCache(),
		transformer: pureTransformer,
	};

	return imageLoader(config, request);
};
