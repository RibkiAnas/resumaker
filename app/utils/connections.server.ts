import { createCookieSessionStorage } from "@remix-run/cloudflare";
import { type ProviderName } from "./connections";
import { GitHubProvider } from "./providers/github.server";
import { type AuthProvider } from "./providers/provider";

export const connectionSessionStorage = createCookieSessionStorage({
	cookie: {
		name: "en_connection",
		sameSite: "lax",
		path: "/",
		httpOnly: true,
		maxAge: 60 * 10, // 10 minutes
		secrets: ["a15fghJd"],
		secure: process.env.NODE_ENV === "production",
	},
});

export const providers: Record<ProviderName, AuthProvider> = {
	github: new GitHubProvider(),
}

// export function handleMockAction(providerName: ProviderName, request: Request) {
// 	return providers[providerName].handleMockAction(request)
// }

export function resolveConnectionData(
	providerName: ProviderName,
	providerId: string,
) {
	return providers[providerName].resolveConnectionData(providerId)
}
