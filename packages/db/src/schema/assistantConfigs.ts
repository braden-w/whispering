import { pgTable, text, timestamp, unique } from 'drizzle-orm/pg-core';

import { user } from './auth';

export const assistantConfig = pgTable(
	'assistant_config',
	{
		id: text('id').primaryKey(),
		userId: text('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		name: text('name').notNull(),
		url: text('url').notNull(),
		password: text('password'),
		createdAt: timestamp('created_at')
			.$defaultFn(() => /* @__PURE__ */ new Date())
			.notNull(),
		updatedAt: timestamp('updated_at')
			.$defaultFn(() => /* @__PURE__ */ new Date())
			.notNull(),
		lastAccessedAt: timestamp('last_accessed_at')
			.$defaultFn(() => /* @__PURE__ */ new Date())
			.notNull(),
	},
	(table) => ({
		userUrlUnique: unique('user_url_unique').on(table.userId, table.url),
	}),
);
