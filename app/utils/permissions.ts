import { AppLoadContext, json } from "@remix-run/cloudflare";
import { useUser } from "./user";
import { buildDbClient } from "./client";
import { requireUserId } from "./auth.server";
import {
	permissions,
	permissionsToRoles,
	roles,
	rolesToUsers,
	users,
} from "~/drizzle/schema.server";
import { and, eq, inArray } from "drizzle-orm";

export async function requireUserWithPermission(
	request: Request,
	context: AppLoadContext,
	permission: PermissionString
) {
	const userId = await requireUserId(request, context);
	const permissionData = parsePermissionString(permission);
	const db = buildDbClient(context);

	const results = await db.transaction(async (tx) => {
		const userPermissions = await tx.query.permissions.findMany({
			columns: { id: true },
			where: and(
				eq(permissions.entity, permissionData.entity),
				eq(permissions.action, permissionData.action),
				inArray(permissions.access, permissionData.access!)
			),
		});

		const userRoles = await tx.query.rolesToUsers.findMany({
			columns: { roleId: true },
			where: eq(rolesToUsers.userId, userId),
		});

		const userRolePermission = await tx.query.permissionsToRoles.findFirst({
			with: {
				role: {
					with: {
						rolesToUsers: {
							columns: { userId: true },
						},
					},
				},
			},
			where: and(
				inArray(
					permissionsToRoles.permissionId,
					userPermissions.map((permission) => permission.id)
				),
				inArray(
					permissionsToRoles.roleId,
					userRoles.map((role) => role.roleId)
				)
			),
		});
		return userRolePermission ? userRolePermission.role.rolesToUsers[0] : null;
	});

	if (!results) {
		throw json("Unauthorized", { status: 403 });
	}

	return results.userId;
}

export async function requireUserWithRole(
	request: Request,
	context: AppLoadContext,
	name: string
) {
	const userId = await requireUserId(request, context);
	const db = buildDbClient(context);

	const results = await db.transaction(async (tx) => {
		const user = await tx.query.users.findFirst({
			columns: {
				id: true,
			},
			where: eq(users.id, userId),
		});

		const role = await tx.query.roles.findFirst({
			columns: {
				id: true,
			},
			where: eq(roles.name, name),
		});

		return await tx.query.rolesToUsers.findFirst({
			where: and(
				eq(rolesToUsers.userId, user?.id || ""),
				eq(rolesToUsers.roleId, role?.id || "")
			),
		});
	});

	if (!results) {
		throw json(
			{
				error: "Unauthorized",
				requiredRole: name,
				message: `Unauthorized: required role: ${name}`,
			},
			{ status: 403 }
		);
	}
	return results.userId;
}

type Action = "create" | "read" | "update" | "delete";
type Entity = "user" | "note";
type Access = "own" | "any" | "own,any" | "any,own";
type PermissionString = `${Action}:${Entity}` | `${Action}:${Entity}:${Access}`;
function parsePermissionString(permissionString: PermissionString) {
	const [action, entity, access] = permissionString.split(":") as [
		Action,
		Entity,
		Access | undefined
	];
	return {
		action,
		entity,
		access: access ? (access.split(",") as Array<Access>) : undefined,
	};
}

export function userHasPermission(
	user: Pick<ReturnType<typeof useUser>, "rolesToUsers"> | null,
	permission: PermissionString
) {
	if (!user) return false;
	const { action, entity, access } = parsePermissionString(permission);
	return user.rolesToUsers.some((role) =>
		role.role.permissionsToRoles.some(
			(permission) =>
				permission.permission.entity === entity &&
				permission.permission.action === action &&
				(!access || access.includes(permission.permission.access as Access))
		)
	);
}

export function userHasRole(
	user: Pick<ReturnType<typeof useUser>, "rolesToUsers"> | null,
	role: string
) {
	if (!user) return false;
	return user.rolesToUsers.some((r) => r.role.name === role);
}
