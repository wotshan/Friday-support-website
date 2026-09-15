import { createInsertSchema } from "drizzle-zod";
import { boolean, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const botSettingsTable = pgTable("bot_settings", {
  id: integer("id").primaryKey().default(1),
  status: text("status").notNull().default("online"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const botActivityTable = pgTable("bot_activity", {
  id: text("id").primaryKey(),
  timestamp: timestamp("timestamp", { withTimezone: true }).notNull().defaultNow(),
  message: text("message").notNull(),
  status: text("status").notNull(),
  service: text("service").notNull(),
});

export const insertBotActivitySchema = createInsertSchema(botActivityTable).omit({
  timestamp: true,
});
export type InsertBotActivity = z.infer<typeof insertBotActivitySchema>;
export type BotActivity = typeof botActivityTable.$inferSelect;
export type BotSettings = typeof botSettingsTable.$inferSelect;