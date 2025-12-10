import { db } from "./db";
import { users, campaigns, campaignMetrics, forecasts } from "@shared/schema";
import bcrypt from "bcryptjs";

const CHANNELS = ["email", "social", "ppc", "display", "affiliate"] as const;
const STATUSES = ["active", "paused", "completed", "draft"] as const;

const COMPANIES = [
  "TechCorp",
  "Alpha Innovations", 
  "NexGen Systems",
  "DataTech Solutions",
  "Innovate Industries",
];

const TARGET_AUDIENCES = [
  "Men 18-24",
  "Men 25-34",
  "Women 25-34",
  "Women 35-44",
  "All Ages",
];

const CUSTOMER_SEGMENTS = [
  "Tech Enthusiasts",
  "Fashionistas",
  "Health & Wellness",
  "Foodies",
  "Outdoor Adventurers",
];

const LOCATIONS = ["New York", "Los Angeles", "Chicago", "Houston", "Miami"];

const CAMPAIGN_NAMES = [
  "Summer Sale 2024",
  "Back to School Promotion",
  "Holiday Gift Guide",
  "New Product Launch",
  "Customer Loyalty Rewards",
  "Flash Sale Weekend",
  "Early Bird Discount",
  "Seasonal Clearance",
  "VIP Member Exclusive",
  "Brand Awareness Campaign",
  "Referral Program Boost",
  "Win-back Campaign",
  "Newsletter Signup Drive",
  "Product Demo Series",
  "Social Media Contest",
  "Influencer Partnership",
  "Email Retargeting",
  "PPC Optimization",
  "Display Remarketing",
  "Affiliate Growth",
];

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function randomNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDecimal(min: number, max: number, decimals: number = 2): string {
  return (Math.random() * (max - min) + min).toFixed(decimals);
}

function randomChoice<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export async function seedDatabase() {
  console.log("Starting database seed with Kaggle-aligned data...");

  const existingCampaigns = await db.select().from(campaigns).limit(1);
  if (existingCampaigns.length > 0) {
    console.log("Database already seeded, skipping...");
    return;
  }

  const hashedPassword = await bcrypt.hash("password123", 12);
  const [adminUser] = await db.insert(users).values({
    username: "admin",
    email: "admin@campaigniq.com",
    password: hashedPassword,
    role: "admin",
  }).onConflictDoNothing().returning();

  const [analystUser] = await db.insert(users).values({
    username: "analyst",
    email: "analyst@campaigniq.com",
    password: hashedPassword,
    role: "analyst",
  }).onConflictDoNothing().returning();

  const [viewerUser] = await db.insert(users).values({
    username: "viewer",
    email: "viewer@campaigniq.com",
    password: hashedPassword,
    role: "viewer",
  }).onConflictDoNothing().returning();

  const userId = adminUser?.id || analystUser?.id || viewerUser?.id;

  console.log("Created demo users");

  const createdCampaigns = [];
  const now = new Date();
  const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
  const oneMonthAhead = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  for (let i = 0; i < CAMPAIGN_NAMES.length; i++) {
    const startDate = randomDate(sixMonthsAgo, now);
    const durationDays = randomChoice([15, 30, 45, 60]);
    const endDate = Math.random() > 0.3 
      ? new Date(startDate.getTime() + durationDays * 24 * 60 * 60 * 1000)
      : null;
    const budget = randomDecimal(5000, 100000);
    const spent = randomDecimal(1000, parseFloat(budget) * 0.8);
    const company = randomChoice(COMPANIES);
    const targetAudience = randomChoice(TARGET_AUDIENCES);
    const customerSegment = randomChoice(CUSTOMER_SEGMENTS);
    const location = randomChoice(LOCATIONS);

    const [campaign] = await db.insert(campaigns).values({
      name: `${company} - ${CAMPAIGN_NAMES[i]}`,
      description: `${CAMPAIGN_NAMES[i]} targeting ${targetAudience} in ${location}. Customer segment: ${customerSegment}.`,
      status: STATUSES[randomNumber(0, STATUSES.length - 1)],
      channel: CHANNELS[randomNumber(0, CHANNELS.length - 1)],
      budget,
      spent,
      startDate,
      endDate,
      targetAudience: `${targetAudience} - ${customerSegment}`,
      createdBy: userId,
    }).returning();

    createdCampaigns.push(campaign);
  }

  console.log(`Created ${createdCampaigns.length} campaigns`);

  let metricsCount = 0;
  for (const campaign of createdCampaigns) {
    const daysSinceStart = Math.floor(
      (now.getTime() - new Date(campaign.startDate).getTime()) / (24 * 60 * 60 * 1000)
    );
    const daysToGenerate = Math.min(daysSinceStart, 90);

    const baseConversionRate = parseFloat(randomDecimal(0.01, 0.15, 2));
    const baseCTR = parseFloat(randomDecimal(0.02, 0.10, 2));
    const baseROI = parseFloat(randomDecimal(2.0, 8.0, 2));

    for (let d = 0; d < daysToGenerate; d++) {
      const metricDate = new Date(campaign.startDate);
      metricDate.setDate(metricDate.getDate() + d);

      const variance = 0.3;
      const dailyConvRate = baseConversionRate * (1 + (Math.random() - 0.5) * variance);
      const dailyCTR = baseCTR * (1 + (Math.random() - 0.5) * variance);

      const impressions = randomNumber(3000, 60000);
      const clicks = Math.floor(impressions * dailyCTR);
      const conversions = Math.floor(clicks * dailyConvRate);
      
      const acquisitionCost = parseFloat(randomDecimal(5000, 20000));
      const revenuePerConversion = parseFloat(randomDecimal(50, 200));
      const revenue = (conversions * revenuePerConversion).toFixed(2);
      const cost = (acquisitionCost / daysToGenerate).toFixed(2);

      await db.insert(campaignMetrics).values({
        campaignId: campaign.id,
        date: metricDate,
        impressions,
        clicks,
        conversions,
        revenue,
        cost,
      });

      metricsCount++;
    }
  }

  console.log(`Created ${metricsCount} campaign metrics`);

  const forecastTypes = ["conversion_rate", "roi", "revenue"];
  for (const campaign of createdCampaigns.slice(0, 8)) {
    for (const forecastType of forecastTypes) {
      let predicted: string, lower: string, upper: string;

      if (forecastType === "conversion_rate") {
        predicted = randomDecimal(2, 8, 4);
        lower = (parseFloat(predicted) * 0.8).toFixed(4);
        upper = (parseFloat(predicted) * 1.2).toFixed(4);
      } else if (forecastType === "roi") {
        predicted = randomDecimal(150, 400, 4);
        lower = (parseFloat(predicted) * 0.85).toFixed(4);
        upper = (parseFloat(predicted) * 1.15).toFixed(4);
      } else {
        predicted = randomDecimal(50000, 250000, 2);
        lower = (parseFloat(predicted) * 0.9).toFixed(2);
        upper = (parseFloat(predicted) * 1.1).toFixed(2);
      }

      await db.insert(forecasts).values({
        campaignId: campaign.id,
        forecastType,
        forecastDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
        predictedValue: predicted,
        confidenceLower: lower,
        confidenceUpper: upper,
        confidenceLevel: randomDecimal(0.85, 0.95, 2),
        modelVersion: "v2.4.1",
      });
    }
  }

  console.log("Created forecasts");
  console.log("Database seed completed successfully!");
}

seedDatabase().catch(console.error);
