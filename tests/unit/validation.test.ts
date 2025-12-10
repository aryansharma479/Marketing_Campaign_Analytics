import { describe, it, expect } from '@jest/globals';
import { z } from 'zod';

const insertUserSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  role: z.enum(["admin", "analyst", "viewer"]).optional(),
});

const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

const insertCampaignSchema = z.object({
  name: z.string().min(1).max(200),
  budget: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, "Budget must be a positive number"),
  startDate: z.string().or(z.date()),
  endDate: z.string().or(z.date()).optional().nullable(),
  channel: z.enum(["email", "social", "ppc", "display", "affiliate"]),
  status: z.enum(["active", "paused", "completed", "draft"]).optional(),
});

const dateRangeSchema = z.object({
  startDate: z.string().or(z.date()),
  endDate: z.string().or(z.date()),
}).refine((data) => new Date(data.startDate) <= new Date(data.endDate), {
  message: "Start date must be before or equal to end date",
});

describe('Validation Schemas', () => {
  describe('insertUserSchema', () => {
    it('should validate a valid user', () => {
      const validUser = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        role: 'analyst' as const,
      };

      const result = insertUserSchema.safeParse(validUser);
      expect(result.success).toBe(true);
    });

    it('should reject username less than 3 characters', () => {
      const invalidUser = {
        username: 'ab',
        email: 'test@example.com',
        password: 'password123',
      };

      const result = insertUserSchema.safeParse(invalidUser);
      expect(result.success).toBe(false);
    });

    it('should reject invalid email format', () => {
      const invalidUser = {
        username: 'testuser',
        email: 'invalid-email',
        password: 'password123',
      };

      const result = insertUserSchema.safeParse(invalidUser);
      expect(result.success).toBe(false);
    });

    it('should reject password less than 8 characters', () => {
      const invalidUser = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'short',
      };

      const result = insertUserSchema.safeParse(invalidUser);
      expect(result.success).toBe(false);
    });

    it('should reject invalid role', () => {
      const invalidUser = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        role: 'superadmin',
      };

      const result = insertUserSchema.safeParse(invalidUser);
      expect(result.success).toBe(false);
    });

    it('should allow missing role (optional)', () => {
      const validUser = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      };

      const result = insertUserSchema.safeParse(validUser);
      expect(result.success).toBe(true);
    });
  });

  describe('loginSchema', () => {
    it('should validate valid login credentials', () => {
      const validLogin = {
        email: 'test@example.com',
        password: 'password123',
      };

      const result = loginSchema.safeParse(validLogin);
      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const invalidLogin = {
        email: 'not-an-email',
        password: 'password123',
      };

      const result = loginSchema.safeParse(invalidLogin);
      expect(result.success).toBe(false);
    });

    it('should reject empty password', () => {
      const invalidLogin = {
        email: 'test@example.com',
        password: '',
      };

      const result = loginSchema.safeParse(invalidLogin);
      expect(result.success).toBe(false);
    });
  });

  describe('insertCampaignSchema', () => {
    it('should validate a valid campaign', () => {
      const validCampaign = {
        name: 'Summer Sale 2024',
        budget: '50000',
        startDate: '2024-06-01',
        channel: 'email' as const,
        status: 'active' as const,
      };

      const result = insertCampaignSchema.safeParse(validCampaign);
      expect(result.success).toBe(true);
    });

    it('should reject empty campaign name', () => {
      const invalidCampaign = {
        name: '',
        budget: '50000',
        startDate: '2024-06-01',
        channel: 'email',
      };

      const result = insertCampaignSchema.safeParse(invalidCampaign);
      expect(result.success).toBe(false);
    });

    it('should reject negative budget', () => {
      const invalidCampaign = {
        name: 'Summer Sale',
        budget: '-1000',
        startDate: '2024-06-01',
        channel: 'email',
      };

      const result = insertCampaignSchema.safeParse(invalidCampaign);
      expect(result.success).toBe(false);
    });

    it('should reject invalid channel', () => {
      const invalidCampaign = {
        name: 'Summer Sale',
        budget: '50000',
        startDate: '2024-06-01',
        channel: 'invalid-channel',
      };

      const result = insertCampaignSchema.safeParse(invalidCampaign);
      expect(result.success).toBe(false);
    });

    it('should allow all valid channels', () => {
      const channels = ['email', 'social', 'ppc', 'display', 'affiliate'];

      channels.forEach((channel) => {
        const campaign = {
          name: 'Test Campaign',
          budget: '10000',
          startDate: '2024-01-01',
          channel,
        };

        const result = insertCampaignSchema.safeParse(campaign);
        expect(result.success).toBe(true);
      });
    });

    it('should allow nullable endDate', () => {
      const campaign = {
        name: 'Ongoing Campaign',
        budget: '25000',
        startDate: '2024-01-01',
        endDate: null,
        channel: 'social' as const,
      };

      const result = insertCampaignSchema.safeParse(campaign);
      expect(result.success).toBe(true);
    });
  });

  describe('dateRangeSchema', () => {
    it('should validate valid date range', () => {
      const validRange = {
        startDate: '2024-01-01',
        endDate: '2024-12-31',
      };

      const result = dateRangeSchema.safeParse(validRange);
      expect(result.success).toBe(true);
    });

    it('should accept equal start and end dates', () => {
      const sameDay = {
        startDate: '2024-06-15',
        endDate: '2024-06-15',
      };

      const result = dateRangeSchema.safeParse(sameDay);
      expect(result.success).toBe(true);
    });

    it('should reject end date before start date', () => {
      const invalidRange = {
        startDate: '2024-12-31',
        endDate: '2024-01-01',
      };

      const result = dateRangeSchema.safeParse(invalidRange);
      expect(result.success).toBe(false);
    });
  });
});
