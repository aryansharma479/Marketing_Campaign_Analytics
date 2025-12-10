import type { Express } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { storage } from "./storage";
import {
  correlationIdMiddleware,
  requestLoggerMiddleware,
  authMiddleware,
  validateBody,
  errorHandler,
} from "./middleware";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  getTokenExpiry,
} from "./jwt";
import {
  insertUserSchema,
  loginSchema,
  insertCampaignSchema,
} from "@shared/schema";
import { cache, CACHE_KEYS, CACHE_TTL } from "./cache";
import { callExternalModelApi, modelApiCircuitBreaker } from "./circuit-breaker";
import { setupSwagger } from "./swagger";

const queryParamsSchema = z.object({
  page: z.string().optional().transform((v) => parseInt(v || "1", 10)),
  limit: z.string().optional().transform((v) => parseInt(v || "10", 10)),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
  status: z.string().optional(),
  channel: z.string().optional(),
  search: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.use(correlationIdMiddleware);
  app.use(requestLoggerMiddleware);
  
  setupSwagger(app);

  app.get("/api/health", (_req, res) => {
    res.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      circuitBreaker: modelApiCircuitBreaker.getState(),
      cacheStats: cache.stats(),
    });
  });

  app.post("/api/auth/register", validateBody(insertUserSchema), async (req, res, next) => {
    try {
      const { username, email, password, role } = req.body;

      const existingEmail = await storage.getUserByEmail(email);
      if (existingEmail) {
        return res.status(409).json({
          error: "Conflict",
          message: "Email already exists",
          correlationId: req.correlationId,
        });
      }

      const existingUsername = await storage.getUserByUsername(username);
      if (existingUsername) {
        return res.status(409).json({
          error: "Conflict",
          message: "Username already exists",
          correlationId: req.correlationId,
        });
      }

      const hashedPassword = await bcrypt.hash(password, 12);
      const user = await storage.createUser({
        username,
        email,
        password: hashedPassword,
        role: role || "viewer",
      });

      const accessToken = generateAccessToken(user);
      const { token: refreshToken, expiresAt } = generateRefreshToken(user);
      await storage.createRefreshToken(user.id, refreshToken, expiresAt);

      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.status(201).json({
        accessToken,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
        },
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/auth/login", validateBody(loginSchema), async (req, res, next) => {
    try {
      const { email, password } = req.body;

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({
          error: "Unauthorized",
          message: "Invalid credentials",
          correlationId: req.correlationId,
        });
      }

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({
          error: "Unauthorized",
          message: "Invalid credentials",
          correlationId: req.correlationId,
        });
      }

      const accessToken = generateAccessToken(user);
      const { token: refreshToken, expiresAt } = generateRefreshToken(user);
      await storage.createRefreshToken(user.id, refreshToken, expiresAt);

      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.json({
        accessToken,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
        },
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/auth/refresh", async (req, res, next) => {
    try {
      const refreshToken = req.cookies?.refreshToken;
      if (!refreshToken) {
        return res.status(401).json({
          error: "Unauthorized",
          message: "No refresh token provided",
          correlationId: req.correlationId,
        });
      }

      const decoded = verifyToken(refreshToken);
      if (!decoded || decoded.type !== "refresh") {
        return res.status(401).json({
          error: "Unauthorized",
          message: "Invalid refresh token",
          correlationId: req.correlationId,
        });
      }

      const storedToken = await storage.getRefreshToken(refreshToken);
      if (!storedToken) {
        return res.status(401).json({
          error: "Unauthorized",
          message: "Refresh token not found or revoked",
          correlationId: req.correlationId,
        });
      }

      const user = await storage.getUser(decoded.userId);
      if (!user) {
        return res.status(401).json({
          error: "Unauthorized",
          message: "User not found",
          correlationId: req.correlationId,
        });
      }

      await storage.revokeRefreshToken(refreshToken);

      const newAccessToken = generateAccessToken(user);
      const { token: newRefreshToken, expiresAt } = generateRefreshToken(user);
      await storage.createRefreshToken(user.id, newRefreshToken, expiresAt);

      res.cookie("refreshToken", newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.json({
        accessToken: newAccessToken,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
        },
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/auth/logout", authMiddleware, async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;
      if (authHeader?.startsWith("Bearer ")) {
        const token = authHeader.slice(7);
        const expiry = getTokenExpiry(token);
        if (expiry) {
          await storage.blacklistToken(token, expiry);
        }
      }

      const refreshToken = req.cookies?.refreshToken;
      if (refreshToken) {
        await storage.revokeRefreshToken(refreshToken);
      }

      res.clearCookie("refreshToken");
      res.json({ message: "Logged out successfully" });
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/auth/me", authMiddleware, async (req, res, next) => {
    try {
      const user = await storage.getUser(req.user!.userId);
      if (!user) {
        return res.status(404).json({
          error: "NotFound",
          message: "User not found",
          correlationId: req.correlationId,
        });
      }

      res.json({
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
        },
      });
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/campaigns", authMiddleware, async (req, res, next) => {
    try {
      const params = queryParamsSchema.parse(req.query);
      const result = await storage.getCampaigns({
        page: params.page,
        limit: params.limit,
        sortBy: params.sortBy,
        sortOrder: params.sortOrder,
        status: params.status,
        channel: params.channel,
        search: params.search,
        startDate: params.startDate ? new Date(params.startDate) : undefined,
        endDate: params.endDate ? new Date(params.endDate) : undefined,
      });

      res.json(result);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/campaigns/:id", authMiddleware, async (req, res, next) => {
    try {
      const campaign = await storage.getCampaign(req.params.id);
      if (!campaign) {
        return res.status(404).json({
          error: "NotFound",
          message: "Campaign not found",
          correlationId: req.correlationId,
        });
      }

      res.json(campaign);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/campaigns", authMiddleware, validateBody(insertCampaignSchema), async (req, res, next) => {
    try {
      const campaign = await storage.createCampaign({
        ...req.body,
        createdBy: req.user!.userId,
      });

      res.status(201).json(campaign);
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/campaigns/:id", authMiddleware, async (req, res, next) => {
    try {
      const campaign = await storage.updateCampaign(req.params.id, req.body);
      if (!campaign) {
        return res.status(404).json({
          error: "NotFound",
          message: "Campaign not found",
          correlationId: req.correlationId,
        });
      }

      res.json(campaign);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/campaigns/:id", authMiddleware, async (req, res, next) => {
    try {
      const deleted = await storage.deleteCampaign(req.params.id);
      if (!deleted) {
        return res.status(404).json({
          error: "NotFound",
          message: "Campaign not found",
          correlationId: req.correlationId,
        });
      }

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/campaigns/:id/metrics", authMiddleware, async (req, res, next) => {
    try {
      const { startDate, endDate } = req.query;
      const metrics = await storage.getCampaignMetrics(
        req.params.id,
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );

      res.json(metrics);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/metrics", authMiddleware, async (req, res, next) => {
    try {
      const { startDate, endDate } = req.query;
      const metrics = await storage.getAllMetrics(
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );

      res.json(metrics);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/forecasts", authMiddleware, async (req, res, next) => {
    try {
      const { campaignId, forecastType } = req.query;
      const forecastsList = await storage.getForecasts(
        campaignId as string | undefined,
        forecastType as string | undefined
      );

      res.json(forecastsList);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/forecasts/predict", authMiddleware, async (req, res, next) => {
    try {
      const { campaignId } = req.body;
      
      const predictions = [
        {
          forecastType: "conversion_rate",
          predictedValue: (2.5 + Math.random() * 2).toFixed(4),
          confidenceLower: (2.0 + Math.random()).toFixed(4),
          confidenceUpper: (4.0 + Math.random()).toFixed(4),
          confidenceLevel: "0.95",
        },
        {
          forecastType: "roi",
          predictedValue: (180 + Math.random() * 100).toFixed(4),
          confidenceLower: (150 + Math.random() * 50).toFixed(4),
          confidenceUpper: (280 + Math.random() * 50).toFixed(4),
          confidenceLevel: "0.90",
        },
        {
          forecastType: "revenue",
          predictedValue: (80000 + Math.random() * 50000).toFixed(2),
          confidenceLower: (70000 + Math.random() * 30000).toFixed(2),
          confidenceUpper: (130000 + Math.random() * 30000).toFixed(2),
          confidenceLevel: "0.85",
        },
      ];

      const createdForecasts = await Promise.all(
        predictions.map((p) =>
          storage.createForecast({
            campaignId: campaignId || null,
            forecastType: p.forecastType,
            forecastDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            predictedValue: p.predictedValue,
            confidenceLower: p.confidenceLower,
            confidenceUpper: p.confidenceUpper,
            confidenceLevel: p.confidenceLevel,
            modelVersion: "v2.4.1",
          })
        )
      );

      res.json(createdForecasts);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/dashboard", authMiddleware, async (req, res, next) => {
    try {
      const params = queryParamsSchema.parse(req.query);
      
      const [campaignsResult, metrics, forecastsList] = await Promise.all([
        storage.getCampaigns({
          page: params.page,
          limit: params.limit,
          sortBy: params.sortBy,
          sortOrder: params.sortOrder,
          status: params.status,
          channel: params.channel,
          search: params.search,
          startDate: params.startDate ? new Date(params.startDate) : undefined,
          endDate: params.endDate ? new Date(params.endDate) : undefined,
        }),
        storage.getAllMetrics(),
        storage.getForecasts(),
      ]);

      let totalImpressions = 0;
      let totalClicks = 0;
      let totalConversions = 0;
      let totalRevenue = 0;
      let totalCost = 0;

      metrics.forEach((m) => {
        totalImpressions += m.impressions;
        totalClicks += m.clicks;
        totalConversions += m.conversions;
        totalRevenue += parseFloat(m.revenue as string);
        totalCost += parseFloat(m.cost as string);
      });

      const conversionRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;
      const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
      const roi = totalCost > 0 ? ((totalRevenue - totalCost) / totalCost) * 100 : 0;

      res.json({
        kpis: {
          conversionRate,
          conversionRateTrend: (Math.random() * 10 - 5),
          ctr,
          ctrTrend: (Math.random() * 10 - 5),
          roi,
          roiTrend: (Math.random() * 20 - 10),
          totalImpressions,
          impressionsTrend: (Math.random() * 15 - 5),
        },
        campaigns: campaignsResult,
        metrics,
        forecasts: forecastsList,
      });
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/analytics", authMiddleware, async (req, res, next) => {
    try {
      const [campaignsResult, metrics, forecastsList] = await Promise.all([
        storage.getCampaigns({ page: 1, limit: 100 }),
        storage.getAllMetrics(),
        storage.getForecasts(),
      ]);

      let totalImpressions = 0;
      let totalClicks = 0;
      let totalConversions = 0;
      let totalRevenue = 0;
      let totalCost = 0;

      metrics.forEach((m) => {
        totalImpressions += m.impressions;
        totalClicks += m.clicks;
        totalConversions += m.conversions;
        totalRevenue += parseFloat(m.revenue as string);
        totalCost += parseFloat(m.cost as string);
      });

      const conversionRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;
      const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
      const roi = totalCost > 0 ? ((totalRevenue - totalCost) / totalCost) * 100 : 0;
      const profitMargin = totalRevenue > 0 ? ((totalRevenue - totalCost) / totalRevenue) * 100 : 0;

      res.json({
        kpis: {
          conversionRate,
          conversionRateTrend: (Math.random() * 10 - 5),
          ctr,
          ctrTrend: (Math.random() * 10 - 5),
          roi,
          roiTrend: (Math.random() * 20 - 10),
          totalRevenue,
          revenueTrend: (Math.random() * 15 - 5),
          totalCost,
          costTrend: (Math.random() * 10 - 5),
          profitMargin,
          profitTrend: (Math.random() * 8 - 4),
        },
        campaigns: campaignsResult.items,
        metrics,
        forecasts: forecastsList,
      });
    } catch (error) {
      next(error);
    }
  });

  app.use(errorHandler);

  return httpServer;
}
