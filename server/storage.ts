import {
  users,
  campaigns,
  campaignMetrics,
  kpiSummaries,
  forecasts,
  refreshTokens,
  tokenBlacklist,
  type User,
  type InsertUser,
  type Campaign,
  type InsertCampaign,
  type CampaignMetric,
  type KpiSummary,
  type Forecast,
  type RefreshToken,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte, like, desc, asc, sql, count } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  createRefreshToken(userId: string, token: string, expiresAt: Date): Promise<void>;
  getRefreshToken(token: string): Promise<RefreshToken | undefined>;
  revokeRefreshToken(token: string): Promise<void>;
  revokeAllUserTokens(userId: string): Promise<void>;

  blacklistToken(token: string, expiresAt: Date): Promise<void>;
  isTokenBlacklisted(token: string): Promise<boolean>;
  cleanupExpiredTokens(): Promise<void>;

  getCampaigns(options: {
    page: number;
    limit: number;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
    status?: string;
    channel?: string;
    search?: string;
    startDate?: Date;
    endDate?: Date;
    userId?: string;
  }): Promise<{ items: Campaign[]; total: number; page: number; totalPages: number }>;
  getCampaign(id: string): Promise<Campaign | undefined>;
  createCampaign(campaign: Omit<InsertCampaign, "id">): Promise<Campaign>;
  updateCampaign(id: string, campaign: Partial<InsertCampaign>): Promise<Campaign | undefined>;
  deleteCampaign(id: string): Promise<boolean>;

  getCampaignMetrics(campaignId: string, startDate?: Date, endDate?: Date): Promise<CampaignMetric[]>;
  getAllMetrics(startDate?: Date, endDate?: Date): Promise<CampaignMetric[]>;
  createMetric(metric: Omit<CampaignMetric, "id" | "createdAt">): Promise<CampaignMetric>;

  getKpiSummary(period: string, periodStart: Date): Promise<KpiSummary | undefined>;
  createKpiSummary(summary: Omit<KpiSummary, "id" | "createdAt">): Promise<KpiSummary>;

  getForecasts(campaignId?: string, forecastType?: string): Promise<Forecast[]>;
  createForecast(forecast: Omit<Forecast, "id" | "createdAt">): Promise<Forecast>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async createRefreshToken(userId: string, token: string, expiresAt: Date): Promise<void> {
    await db.insert(refreshTokens).values({ userId, token, expiresAt });
  }

  async getRefreshToken(token: string): Promise<RefreshToken | undefined> {
    const [refreshToken] = await db.select().from(refreshTokens)
      .where(and(eq(refreshTokens.token, token), eq(refreshTokens.revoked, false)));
    return refreshToken;
  }

  async revokeRefreshToken(token: string): Promise<void> {
    await db.update(refreshTokens).set({ revoked: true }).where(eq(refreshTokens.token, token));
  }

  async revokeAllUserTokens(userId: string): Promise<void> {
    await db.update(refreshTokens).set({ revoked: true }).where(eq(refreshTokens.userId, userId));
  }

  async blacklistToken(token: string, expiresAt: Date): Promise<void> {
    await db.insert(tokenBlacklist).values({ token, expiresAt }).onConflictDoNothing();
  }

  async isTokenBlacklisted(token: string): Promise<boolean> {
    const [result] = await db.select().from(tokenBlacklist).where(eq(tokenBlacklist.token, token));
    return !!result;
  }

  async cleanupExpiredTokens(): Promise<void> {
    const now = new Date();
    await db.delete(tokenBlacklist).where(lte(tokenBlacklist.expiresAt, now));
    await db.delete(refreshTokens).where(lte(refreshTokens.expiresAt, now));
  }

  async getCampaigns(options: {
    page: number;
    limit: number;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
    status?: string;
    channel?: string;
    search?: string;
    startDate?: Date;
    endDate?: Date;
    userId?: string;
  }): Promise<{ items: Campaign[]; total: number; page: number; totalPages: number }> {
    const { page, limit, sortBy = "startDate", sortOrder = "desc", status, channel, search, startDate, endDate } = options;
    const offset = (page - 1) * limit;

    const conditions = [];
    if (status && status !== "all") {
      conditions.push(eq(campaigns.status, status));
    }
    if (channel && channel !== "all") {
      conditions.push(eq(campaigns.channel, channel));
    }
    if (search) {
      conditions.push(like(campaigns.name, `%${search}%`));
    }
    if (startDate) {
      conditions.push(gte(campaigns.startDate, startDate));
    }
    if (endDate) {
      conditions.push(lte(campaigns.startDate, endDate));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const sortColumn = sortBy === "name" ? campaigns.name
      : sortBy === "status" ? campaigns.status
      : sortBy === "channel" ? campaigns.channel
      : sortBy === "budget" ? campaigns.budget
      : sortBy === "spent" ? campaigns.spent
      : campaigns.startDate;

    const orderBy = sortOrder === "asc" ? asc(sortColumn) : desc(sortColumn);

    const [items, [{ total }]] = await Promise.all([
      db.select().from(campaigns)
        .where(whereClause)
        .orderBy(orderBy)
        .limit(limit)
        .offset(offset),
      db.select({ total: count() }).from(campaigns).where(whereClause),
    ]);

    return {
      items,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getCampaign(id: string): Promise<Campaign | undefined> {
    const [campaign] = await db.select().from(campaigns).where(eq(campaigns.id, id));
    return campaign;
  }

  async createCampaign(campaign: Omit<InsertCampaign, "id">): Promise<Campaign> {
    const [created] = await db.insert(campaigns).values({
      ...campaign,
      startDate: new Date(campaign.startDate as string),
      endDate: campaign.endDate ? new Date(campaign.endDate as string) : null,
    }).returning();
    return created;
  }

  async updateCampaign(id: string, campaign: Partial<InsertCampaign>): Promise<Campaign | undefined> {
    const updateData: any = { ...campaign, updatedAt: new Date() };
    if (campaign.startDate) {
      updateData.startDate = new Date(campaign.startDate as string);
    }
    if (campaign.endDate) {
      updateData.endDate = new Date(campaign.endDate as string);
    }
    
    const [updated] = await db.update(campaigns).set(updateData).where(eq(campaigns.id, id)).returning();
    return updated;
  }

  async deleteCampaign(id: string): Promise<boolean> {
    const result = await db.delete(campaigns).where(eq(campaigns.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getCampaignMetrics(campaignId: string, startDate?: Date, endDate?: Date): Promise<CampaignMetric[]> {
    const conditions = [eq(campaignMetrics.campaignId, campaignId)];
    if (startDate) conditions.push(gte(campaignMetrics.date, startDate));
    if (endDate) conditions.push(lte(campaignMetrics.date, endDate));
    
    return db.select().from(campaignMetrics)
      .where(and(...conditions))
      .orderBy(desc(campaignMetrics.date));
  }

  async getAllMetrics(startDate?: Date, endDate?: Date): Promise<CampaignMetric[]> {
    const conditions = [];
    if (startDate) conditions.push(gte(campaignMetrics.date, startDate));
    if (endDate) conditions.push(lte(campaignMetrics.date, endDate));
    
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    
    return db.select().from(campaignMetrics)
      .where(whereClause)
      .orderBy(desc(campaignMetrics.date));
  }

  async createMetric(metric: Omit<CampaignMetric, "id" | "createdAt">): Promise<CampaignMetric> {
    const [created] = await db.insert(campaignMetrics).values(metric).returning();
    return created;
  }

  async getKpiSummary(period: string, periodStart: Date): Promise<KpiSummary | undefined> {
    const [summary] = await db.select().from(kpiSummaries)
      .where(and(eq(kpiSummaries.period, period), eq(kpiSummaries.periodStart, periodStart)));
    return summary;
  }

  async createKpiSummary(summary: Omit<KpiSummary, "id" | "createdAt">): Promise<KpiSummary> {
    const [created] = await db.insert(kpiSummaries).values(summary).returning();
    return created;
  }

  async getForecasts(campaignId?: string, forecastType?: string): Promise<Forecast[]> {
    const conditions = [];
    if (campaignId) conditions.push(eq(forecasts.campaignId, campaignId));
    if (forecastType) conditions.push(eq(forecasts.forecastType, forecastType));
    
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    
    return db.select().from(forecasts)
      .where(whereClause)
      .orderBy(desc(forecasts.createdAt));
  }

  async createForecast(forecast: Omit<Forecast, "id" | "createdAt">): Promise<Forecast> {
    const [created] = await db.insert(forecasts).values(forecast).returning();
    return created;
  }
}

export const storage = new DatabaseStorage();
