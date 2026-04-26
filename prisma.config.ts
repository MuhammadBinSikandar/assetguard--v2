import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

const directUrl = env('DIRECT_URL');
const shadowDatabaseUrl = process.env.SHADOW_DATABASE_URL;

export default defineConfig({
	schema: 'prisma/schema.prisma',
	migrations: { path: 'prisma/migrations' },
	datasource: {
		// Use the direct (non-pooled) connection for migrations
		url: directUrl,
		...(shadowDatabaseUrl ? { shadowDatabaseUrl } : {}),
	},
});