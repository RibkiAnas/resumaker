/* eslint-disable no-mixed-spaces-and-tabs */
import { LoaderFunctionArgs, json } from "@remix-run/cloudflare";
import { eq } from "drizzle-orm";
import { users } from "~/drizzle/schema.server";
import { requireUserId } from "~/utils/auth.server";
import { buildDbClient } from "~/utils/client";
import { getDomainUrl, invariantResponse } from "~/utils/misc";

export async function loader({ request, context }: LoaderFunctionArgs) {
	const userId = await requireUserId(request, context);

	const db = buildDbClient(context);
	const user = await db.query.users.findFirst({
		where: eq(users.id, userId),
		// this is one of the *few* instances where you can use "include" because
		// the goal is to literally get *everything*. Normally you should be
		// explicit with "select". We're using select for images because we don't
		// want to send back the entire blob of the image. We'll send a URL they can
		// use to download it instead.
		with: {
			image: {
				columns: {
					id: true,
					createdAt: true,
					updatedAt: true,
					contentType: true,
				},
			},
			notes: {
				with: {
					images: {
						columns: {
							id: true,
							createdAt: true,
							updatedAt: true,
							contentType: true,
						},
					},
				},
			},
			sessions: true,
		},
	});

	invariantResponse(user, "User not found", { status: 404 });

	const domain = getDomainUrl(request);

	return json({
		user: {
			...user,
			image: user.image
				? {
						...user.image,
						url: `${domain}/resources/user-images/${user.image.id}`,
				  }
				: null,
			notes: user.notes.map((note) => ({
				...note,
				images: note.images.map((image) => ({
					...image,
					url: `${domain}/resources/note-images/${image.id}`,
				})),
			})),
		},
	});
}
