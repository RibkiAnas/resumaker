import { ActionFunctionArgs, redirect } from '@remix-run/cloudflare';
import { authenticator } from '~/utils/auth.server';
import { getReferrerRoute } from '~/utils/misc';
import { getRedirectCookieHeader } from '~/utils/redirect-cookie.server';

export async function loader() {
	return redirect('/login');
}

export async function action({ request }: ActionFunctionArgs) {
	const providerName = 'github';

	try {
		return await authenticator.authenticate(providerName, request);
	} catch (error: unknown) {
		if (error instanceof Response) {
			const formData = await request.formData();
			const rawRedirectTo = formData.get('redirectTo');
			const redirectTo =
				typeof rawRedirectTo === 'string'
					? rawRedirectTo
					: getReferrerRoute(request);
			const redirectToCookie = getRedirectCookieHeader(redirectTo);
			if (redirectToCookie) {
				error.headers.append('set-cookie', redirectToCookie);
			}
		}
		throw error;
	}
}
