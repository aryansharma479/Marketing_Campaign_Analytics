import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, timestamp, boolean, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table with role-based access control
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("viewer"), // admin, analyst, viewer
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Refresh tokens for JWT authentication
export const refreshTokens = pgTable("refresh_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  revoked: boolean("revoked").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Token blacklist for revoked access tokens
export const tokenBlacklist = pgTable("token_blacklist", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Campaigns table
export const campaigns = pgTable("campaigns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  status: text("status").notNull().default("active"), // active, paused, completed, draft
  channel: text("channel").notNull(), // email, social, ppc, display, affiliate
  budget: decimal("budget", { precision: 12, scale: 2 }).notNull(),
  spent: decimal("spent", { precision: 12, scale: 2 }).default("0").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  targetAudience: text("target_audience"),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("campaigns_status_idx").on(table.status),
  index("campaigns_channel_idx").on(table.channel),
  index("campaigns_start_date_idx").on(table.startDate),
]);

// Campaign metrics (daily aggregated data)
export const campaignMetrics = pgTable("campaign_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  campaignId: varchar("campaign_id").notNull().references(() => campaigns.id, { onDelete: "cascade" }),
  date: timestamp("date").notNull(),
  impressions: integer("impressions").default(0).notNull(),
  clicks: integer("clicks").default(0).notNull(),
  conversions: integer("conversions").default(0).notNull(),
  revenue: decimal("revenue", { precision: 12, scale: 2 }).default("0").notNull(),
  cost: decimal("cost", { precision: 12, scale: 2 }).default("0").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("metrics_campaign_id_idx").on(table.campaignId),
  index("metrics_date_idx").on(table.date),
]);

// Pre-aggregated KPI summaries for performance
export const kpiSummaries = pgTable("kpi_summaries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  period: text("period").notNull(), // daily, weekly, monthly
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  totalImpressions: integer("total_impressions").default(0).notNull(),
  totalClicks: integer("total_clicks").default(0).notNull(),
  totalConversions: integer("total_conversions").default(0).notNull(),
  totalRevenue: decimal("total_revenue", { precision: 14, scale: 2 }).default("0").notNull(),
  totalCost: decimal("total_cost", { precision: 14, scale: 2 }).default("0").notNull(),
  conversionRate: decimal("conversion_rate", { precision: 8, scale: 4 }).default("0").notNull(),
  clickThroughRate: decimal("click_through_rate", { precision: 8, scale: 4 }).default("0").notNull(),
  roi: decimal("roi", { precision: 10, scale: 4 }).default("0").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("kpi_period_idx").on(table.period),
  index("kpi_period_start_idx").on(table.periodStart),
]);

// Forecasts from predictive model
export const forecasts = pgTable("forecasts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  campaignId: varchar("campaign_id").references(() => campaigns.id, { onDelete: "cascade" }),
  forecastType: text("forecast_type").notNull(), // conversion_rate, roi, revenue
  forecastDate: timestamp("forecast_date").notNull(),
  predictedValue: decimal("predicted_value", { precision: 12, scale: 4 }).notNull(),
  confidenceLower: decimal("confidence_lower", { precision: 12, scale: 4 }).notNull(),
  confidenceUpper: decimal("confidence_upper", { precision: 12, scale: 4 }).notNull(),
  confidenceLevel: decimal("confidence_level", { precision: 5, scale: 2 }).default("0.95").notNull(),
  modelVersion: text("model_version").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("forecasts_campaign_idx").on(table.campaignId),
  index("forecasts_type_idx").on(table.forecastType),
  index("forecasts_date_idx").on(table.forecastDate),
]);

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  refreshTokens: many(refreshTokens),
  campaigns: many(campaigns),
}));

export const refreshTokensRelations = relations(refreshTokens, ({ one }) => ({
  user: one(users, {
    fields: [refreshTokens.userId],
    references: [users.id],
  }),
}));

export const campaignsRelations = relations(campaigns, ({ one, many }) => ({
  createdByUser: one(users, {
    fields: [campaigns.createdBy],
    references: [users.id],
  }),
  metrics: many(campaignMetrics),
  forecasts: many(forecasts),
}));

export const campaignMetricsRelations = relations(campaignMetrics, ({ one }) => ({
  campaign: one(campaigns, {
    fields: [campaignMetrics.campaignId],
    references: [campaigns.id],
  }),
}));

export const forecastsRelations = relations(forecasts, ({ one }) => ({
  campaign: one(campaigns, {
    fields: [forecasts.campaignId],
    references: [campaigns.id],
  }),
}));

// Zod schemas for validation
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  password: true,
  role: true,
}).extend({
  username: z.string().min(3).max(50),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  role: z.enum(["admin", "analyst", "viewer"]).optional(),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

export const insertCampaignSchema = createInsertSchema(campaigns).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  name: z.string().min(1).max(200),
  budget: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, "Budget must be a positive number"),
  startDate: z.string().or(z.date()),
  endDate: z.string().or(z.date()).optional().nullable(),
  channel: z.enum(["email", "social", "ppc", "display", "affiliate"]),
  status: z.enum(["active", "paused", "completed", "draft"]).optional(),
});

export const insertMetricSchema = createInsertSchema(campaignMetrics).omit({
  id: true,
  createdAt: true,
}).extend({
  impressions: z.number().int().min(0),
  clicks: z.number().int().min(0),
  conversions: z.number().int().min(0),
  revenue: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0),
  cost: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0),
});

export const dateRangeSchema = z.object({
  startDate: z.string().or(z.date()),
  endDate: z.string().or(z.date()),
}).refine((data) => new Date(data.startDate) <= new Date(data.endDate), {
  message: "Start date must be before or equal to end date",
});

export const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type LoginInput = z.infer<typeof loginSchema>;

export type InsertCampaign = z.infer<typeof insertCampaignSchema>;
export type Campaign = typeof campaigns.$inferSelect;

export type InsertMetric = z.infer<typeof insertMetricSchema>;
export type CampaignMetric = typeof campaignMetrics.$inferSelect;

export type KpiSummary = typeof kpiSummaries.$inferSelect;
export type Forecast = typeof forecasts.$inferSelect;
export type RefreshToken = typeof refreshTokens.$inferSelect;
