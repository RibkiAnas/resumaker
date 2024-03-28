import { type LoaderFunctionArgs } from "@remix-run/cloudflare";
import { eq } from "drizzle-orm";
import { userImage } from "~/drizzle/schema.server";
import { buildDbClient } from "~/utils/client";
import { invariantResponse } from "~/utils/misc";

export async function loader({ context, params }: LoaderFunctionArgs) {
	invariantResponse(params.imageId, "Image ID is required", { status: 400 });
	const db = buildDbClient(context);

	const image = await db.query.userImage.findFirst({
		columns: { contentType: true, blob: true },
		where: eq(userImage.id, params.imageId),
	});

	invariantResponse(image, "Not found", { status: 404 });

	const imageBlob = image.blob as Blob;
	return new Response(imageBlob, {
		headers: {
			"content-type": image.contentType,
			"content-length": Buffer.byteLength(String(imageBlob)).toString(),
			"content-disposition": `inline; filename="${params.imageId}"`,
			"cache-control": "public, max-age=31536000, immutable",
		},
	});
}
