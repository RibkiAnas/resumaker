import { createCookieSessionStorage } from "@remix-run/cloudflare";

export const verifySessionStorage = createCookieSessionStorage({
	cookie: {
		name: "en_verification",
		sameSite: "lax",
		path: "/",
		httpOnly: true,
		maxAge: 60 * 10, // 10 minutes
		secrets: ["a15fghJd"],
		secure: process.env.NODE_ENV === "production",
	},
});
