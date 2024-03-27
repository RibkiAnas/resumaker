import { relations, sql } from 'drizzle-orm';
import {
	blob,
	index,
	integer,
	primaryKey,
	sqliteTable,
	text,
	unique,
} from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
	id: text('id').primaryKey(),
	email: text('email').unique(),
	username: text('username').unique(),
	name: text('name'),

	createdAt: integer('created_at', { mode: 'timestamp' }).default(
		sql`(cast(unixepoch() as int))`
	),
	updatedAt: integer('updated_at', { mode: 'timestamp' }).default(
		sql`(cast(unixepoch() as int))`
	),
});

export const usersRelations = relations(users, ({ one, many }) => ({
	resumes: many(resumes),
	password: one(password, {
		fields: [users.id],
		references: [password.userId],
	}),
	image: one(userImage, {
		fields: [users.id],
		references: [userImage.userId],
	}),
	rolesToUsers: many(rolesToUsers),
	sessions: many(sessions),
	connections: many(connections),
}));

export const password = sqliteTable('password', {
	hash: text('hash'),
	userId: text('user_id')
		.unique()
		.references(() => users.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
});

export const userImage = sqliteTable('user_image', {
	id: text('id').primaryKey(),
	altText: text('alt_text'),
	contentType: text('content_type').notNull(),
	blob: blob('blob'),

	userId: text('user_id')
		.notNull()
		.unique()
		.references(() => users.id, { onDelete: 'cascade', onUpdate: 'cascade' }),

	createdAt: integer('created_at', { mode: 'timestamp' }).default(
		sql`(cast(unixepoch() as int))`
	),
	updatedAt: integer('updated_at', { mode: 'timestamp' }).default(
		sql`(cast(unixepoch() as int))`
	),
});

export const resumes = sqliteTable(
	'resumes',
	{
		id: text('id').primaryKey(),
		title: text('title'),
		content: text('content', { mode: 'json' }),

		ownerId: text('owner_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade', onUpdate: 'cascade' }),

		createdAt: integer('created_at', { mode: 'timestamp' }).default(
			sql`(cast(unixepoch() as int))`
		),
		updatedAt: integer('updated_at', { mode: 'timestamp' }).default(
			sql`(cast(unixepoch() as int))`
		),
	},
	(table) => {
		return {
			// non-unique foreign key
			ownerIdIdx: index('ownerId_idx').on(table.ownerId),
			ownerIdUpdateAtIdx: index('ownerId_updateAt_idx').on(
				table.ownerId,
				table.updatedAt
			),
		};
	}
);

export const resumesRelations = relations(resumes, ({ one }) => ({
	owner: one(users, {
		fields: [resumes.ownerId],
		references: [users.id],
	}),
}));

export const sessions = sqliteTable(
	'sessions',
	{
		id: text('id').primaryKey(),
		expirationDate: integer('expiration_date', { mode: 'timestamp' }),

		userId: text('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade', onUpdate: 'cascade' }),

		createdAt: integer('created_at', { mode: 'timestamp' }).default(
			sql`(cast(unixepoch() as int))`
		),
		updatedAt: integer('updated_at', { mode: 'timestamp' }).default(
			sql`(cast(unixepoch() as int))`
		),
	},
	(table) => {
		return {
			// non-unique foreign key
			userIdIdx: index('userId_idx').on(table.userId),
		};
	}
);

export const sessionsRelations = relations(sessions, ({ one }) => ({
	user: one(users, {
		fields: [sessions.userId],
		references: [users.id],
	}),
}));

export const permissions = sqliteTable(
	'permissions',
	{
		id: text('id').primaryKey(),
		action: text('action'), // e.g. create, read, update, delete
		entity: text('entity'), // e.g. note, user, etc.
		access: text('access'), // e.g. own or any
		description: text('description').default(''),

		createdAt: integer('created_at', { mode: 'timestamp' }).default(
			sql`(cast(unixepoch() as int))`
		),
		updatedAt: integer('updated_at', { mode: 'timestamp' }).default(
			sql`(cast(unixepoch() as int))`
		),
	},
	(t) => ({
		unq: unique().on(t.action, t.entity, t.access),
	})
);

export const permissionsRelations = relations(permissions, ({ many }) => ({
	permissionsToRoles: many(permissionsToRoles),
}));

export const roles = sqliteTable('roles', {
	id: text('id').primaryKey(),
	name: text('action').unique(),
	description: text('description').default(''),

	createdAt: integer('created_at', { mode: 'timestamp' }).default(
		sql`(cast(unixepoch() as int))`
	),
	updatedAt: integer('updated_at', { mode: 'timestamp' }).default(
		sql`(cast(unixepoch() as int))`
	),
});

export const rolesRelations = relations(roles, ({ many }) => ({
	permissionsToRoles: many(permissionsToRoles),
	rolesToUsers: many(rolesToUsers),
}));

export const permissionsToRoles = sqliteTable(
	'permissions_to_roles',
	{
		permissionId: text('permission_id')
			.notNull()
			.references(() => permissions.id, {
				onDelete: 'cascade',
				onUpdate: 'cascade',
			}),
		roleId: text('role_id')
			.notNull()
			.references(() => roles.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
	},
	(t) => ({
		pk: primaryKey({ columns: [t.permissionId, t.roleId] }),
	})
);

export const permissionsToRolesRelations = relations(
	permissionsToRoles,
	({ one }) => ({
		role: one(roles, {
			fields: [permissionsToRoles.roleId],
			references: [roles.id],
		}),
		permission: one(permissions, {
			fields: [permissionsToRoles.permissionId],
			references: [permissions.id],
		}),
	})
);

export const rolesToUsers = sqliteTable(
	'roles_to_users',
	{
		userId: text('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
		roleId: text('role_id')
			.notNull()
			.references(() => roles.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
	},
	(t) => ({
		pk: primaryKey({ columns: [t.userId, t.roleId] }),
	})
);

export const rolesToUsersRelations = relations(rolesToUsers, ({ one }) => ({
	role: one(roles, {
		fields: [rolesToUsers.roleId],
		references: [roles.id],
	}),
	user: one(users, {
		fields: [rolesToUsers.userId],
		references: [users.id],
	}),
}));

export const verifications = sqliteTable(
	'verifications',
	{
		id: text('id').primaryKey(),
		createdAt: integer('created_at', { mode: 'timestamp' }).default(
			sql`(cast(unixepoch() as int))`
		),
		/// The type of verification, e.g. "email" or "phone"
		type: text('type').notNull(),

		/// The thing we're trying to verify, e.g. a user's email or phone number
		target: text('target').notNull(),

		/// The secret key used to generate the otp
		secret: text('secret').notNull(),

		/// The algorithm used to generate the otp
		algorithm: text('algorithm').notNull(),

		/// The number of digits in the otp
		digits: integer('digits').notNull(),

		/// The number of seconds the otp is valid for
		period: integer('period').notNull(),

		/// The valid characters for the otp
		charSet: text('charSet').notNull(),

		/// When it's safe to delete this verification
		expiresAt: integer('expires_at', { mode: 'timestamp' }),
	},
	(t) => ({
		unq: unique().on(t.target, t.type),
	})
);

export const connections = sqliteTable(
	'connections',
	{
		id: text('id').primaryKey(),
		providerName: text('provider_name').notNull(),
		providerId: text('provider_id').notNull(),
		userId: text('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade', onUpdate: 'cascade' }),

		createdAt: integer('created_at', { mode: 'timestamp' }).default(
			sql`(cast(unixepoch() as int))`
		),
		updatedAt: integer('updated_at', { mode: 'timestamp' }).default(
			sql`(cast(unixepoch() as int))`
		),
	},
	(t) => ({
		// non-unique foreign key
		conUserIdIdx: index('con_userId_idx').on(t.userId),
		unq: unique().on(t.providerName, t.providerId),
	})
);

export const connectionsRelations = relations(connections, ({ one }) => ({
	user: one(users, {
		fields: [connections.userId],
		references: [users.id],
	}),
}));
