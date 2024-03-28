import { conform, useForm } from "@conform-to/react";
import { getFieldsetConstraint, parse } from "@conform-to/zod";
import { ActionFunctionArgs, json, redirect } from "@remix-run/cloudflare";
import { Form, Link, useActionData } from "@remix-run/react";
import { eq } from "drizzle-orm";
import { AuthenticityTokenInput } from "remix-utils/csrf/react";
import { z } from "zod";
import { ErrorList, Field } from "~/components/forms";
import { Button } from "~/components/ui/button";
import { Icon } from "~/components/ui/icon";
import { StatusButton } from "~/components/ui/status-button";
import { password } from "~/drizzle/schema.server";
import {
	getPasswordHash,
	requireUserId,
	verifyUserPassword,
} from "~/utils/auth.server";
import { buildDbClient } from "~/utils/client";
import { validateCSRF } from "~/utils/csrf.server";
import { useIsPending } from "~/utils/misc";
import { PasswordSchema } from "~/utils/user-validation";

export const handle = {
	breadcrumb: <Icon name="dots-horizontal">Password</Icon>,
};

const ChangePasswordForm = z
	.object({
		currentPassword: PasswordSchema,
		newPassword: PasswordSchema,
		confirmNewPassword: PasswordSchema,
	})
	.superRefine(({ confirmNewPassword, newPassword }, ctx) => {
		if (confirmNewPassword !== newPassword) {
			ctx.addIssue({
				path: ["confirmNewPassword"],
				code: "custom",
				message: "The passwords must match",
			});
		}
	});

export async function action({ request, context }: ActionFunctionArgs) {
	const userId = await requireUserId(request, context);
	const db = buildDbClient(context);

	const formData = await request.formData();
	await validateCSRF(formData, request.headers);
	const submission = await parse(formData, {
		async: true,
		schema: ChangePasswordForm.superRefine(
			async ({ currentPassword, newPassword }, ctx) => {
				if (currentPassword && newPassword) {
					const user = await verifyUserPassword({
						password: currentPassword,
						context,
						id: userId,
					});

					if (!user) {
						ctx.addIssue({
							path: ["currentPassword"],
							code: "custom",
							message: "Incorrect password.",
						});
					}
				}
			}
		),
	});
	// clear the payload so we don't send the password back to the client
	submission.payload = {};
	if (submission.intent !== "submit") {
		// clear the value so we don't send the password back to the client
		submission.value = undefined;
		return json({ status: "idle", submission } as const);
	}
	if (!submission.value) {
		return json({ status: "error", submission } as const, { status: 400 });
	}

	const { newPassword } = submission.value;

	await db
		.update(password)
		.set({
			hash: await getPasswordHash(newPassword),
			userId,
		})
		.where(eq(password.userId, userId));

	return redirect(`/settings/profile`);
}

export default function ChangePasswordRoute() {
	const actionData = useActionData<typeof action>();
	const isPending = useIsPending();

	const [form, fields] = useForm({
		id: "signup-form",
		constraint: getFieldsetConstraint(ChangePasswordForm),
		lastSubmission: actionData?.submission,
		onValidate({ formData }) {
			return parse(formData, { schema: ChangePasswordForm });
		},
		shouldRevalidate: "onBlur",
	});

	return (
		<Form method="POST" {...form.props} className="mx-auto max-w-md">
			<AuthenticityTokenInput />
			<Field
				labelProps={{ children: "Current Password" }}
				inputProps={conform.input(fields.currentPassword, { type: "password" })}
				errors={fields.currentPassword.errors}
			/>
			<Field
				labelProps={{ children: "New Password" }}
				inputProps={conform.input(fields.newPassword, { type: "password" })}
				errors={fields.newPassword.errors}
			/>
			<Field
				labelProps={{ children: "Confirm New Password" }}
				inputProps={conform.input(fields.confirmNewPassword, {
					type: "password",
				})}
				errors={fields.confirmNewPassword.errors}
			/>
			<ErrorList id={form.errorId} errors={form.errors} />
			<div className="grid w-full grid-cols-2 gap-6">
				<Button variant="secondary" asChild>
					<Link to="..">Cancel</Link>
				</Button>
				<StatusButton
					type="submit"
					status={isPending ? "pending" : actionData?.status ?? "idle"}
				>
					Change Password
				</StatusButton>
			</div>
		</Form>
	);
}
