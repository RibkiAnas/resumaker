import type { Config } from 'drizzle-kit';
import * as dotenv from 'dotenv';
dotenv.config();

export default {
	schema: './app/drizzle/schema.server.ts',
	out: './app/drizzle/migrations',
	// driver: "better-sqlite",
	driver: 'turso',
	// dbCredentials: {
	// 	url: "./data.db", // 👈 this could also be a path to the local sqlite file
	// },
	dbCredentials: {
		url: process.env.TURSO_DB_URL as string,
		authToken: process.env.TURSO_DB_AUTH_TOKEN as string,
	},
} satisfies Config;
