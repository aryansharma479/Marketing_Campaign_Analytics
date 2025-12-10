import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { KpiCard } from "@/components/kpi-card";
import { ForecastCard } from "@/components/forecast-card";
import {
  ConversionRateChart,
  CTRComparisonChart,
  ROIDistributionChart,
  PerformanceOverTimeChart,
} from "@/components/dashboard-charts";
import { useAuth } from "@/lib/auth-context";
import { Target, MousePointer, DollarSign, TrendingUp, BarChart2, PieChart } from "lucide-react";
import type { Campaign, CampaignMetric, Forecast } from "@shared/schema";

interface AnalyticsData {
  kpis: {
    conversionRate: number;
    conversionRateTrend: number;
    ctr: number;
    ctrTrend: number;
    roi: number;
    roiTrend: number;
    totalRevenue: number;
    revenueTrend: number;
    totalCost: number;
    costTrend: number;
    profitMargin: number;
    profitTrend: number;
  };
  campaigns: Campaign[];
  metrics: CampaignMetric[];
  forecasts: Forecast[];
}

export default function AnalyticsPage() {
  const { token } = useAuth();

  const { data: analyticsData, isLoading } = useQuery<AnalyticsData>({
    queryKey: ["/api/analytics"],
    enabled: !!token,
  });

  const conversionChartData = useMemo(() => {
    if (!analyticsData?.metrics) return [];
    const sortedMetrics = [...analyticsData.metrics].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    return sortedMetrics.slice(-30).map((m) => ({
      date: new Date(m.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      value: m.clicks > 0 ? (m.conversions / m.clicks) * 100 : 0,
    }));
  }, [analyticsData?.metrics]);

  const ctrChartData = useMemo(() => {
    if (!analyticsData?.metrics || !analyticsData?.campaigns) return [];
    const channelData: Record<string, { impressions: number; clicks: number }> = {};

    analyticsData.campaigns.forEach((campaign) => {
      if (!channelData[campaign.channel]) {
        channelData[campaign.channel] = { impressions: 0, clicks: 0 };
      }
    });

    analyticsData.metrics.forEach((m) => {
      const campaign = analyticsData.campaigns.find((c) => c.id === m.campaignId);
      if (campaign && channelData[campaign.channel]) {
        channelData[campaign.channel].impressions += m.impressions;
        channelData[campaign.channel].clicks += m.clicks;
      }
    });

    const channelLabels: Record<string, string> = {
      email: "Email",
      social: "Social",
      ppc: "PPC",
      display: "Display",
      affiliate: "Affiliate",
    };

    return Object.entries(channelData).map(([channel, data]) => ({
      name: channelLabels[channel] || channel,
      ctr: data.impressions > 0 ? (data.clicks / data.impressions) * 100 : 0,
      impressions: data.impressions,
    }));
  }, [analyticsData?.metrics, analyticsData?.campaigns]);

  const roiChartData = useMemo(() => {
    if (!analyticsData?.metrics || !analyticsData?.campaigns) return [];
    const channelRevenue: Record<string, number> = {};

    analyticsData.metrics.forEach((m) => {
      const campaign = analyticsData.campaigns.find((c) => c.id === m.campaignId);
      if (campaign) {
        if (!channelRevenue[campaign.channel]) {
          channelRevenue[campaign.channel] = 0;
        }
        channelRevenue[campaign.channel] += parseFloat(m.revenue as string);
      }
    });

    const channelLabels: Record<string, string> = {
      email: "Email",
      social: "Social",
      ppc: "PPC",
      display: "Display",
      affiliate: "Affiliate",
    };

    return Object.entries(channelRevenue).map(([channel, revenue]) => ({
      name: channelLabels[channel] || channel,
      value: revenue,
    }));
  }, [analyticsData?.metrics, analyticsData?.campaigns]);

  const performanceChartData = useMemo(() => {
    if (!analyticsData?.metrics) return [];
    const sortedMetrics = [...analyticsData.metrics].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const dailyData: Record<string, { revenue: number; cost: number }> = {};
    sortedMetrics.forEach((m) => {
      const date = new Date(m.date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
      if (!dailyData[date]) {
        dailyData[date] = { revenue: 0, cost: 0 };
      }
      dailyData[date].revenue += parseFloat(m.revenue as string);
      dailyData[date].cost += parseFloat(m.cost as string);
    });

    return Object.entries(dailyData).slice(-14).map(([date, data]) => ({
      date,
      value: data.revenue,
      revenue: data.revenue,
      cost: data.cost,
    }));
  }, [analyticsData?.metrics]);

  const forecastItems = useMemo(() => {
    if (!analyticsData?.forecasts?.length) {
      return [
        { label: "Conversion Rate", predicted: 3.45, confidenceLower: 2.9, confidenceUpper: 4.0, confidenceLevel: 0.95, unit: "%" },
        { label: "ROI", predicted: 245, confidenceLower: 210, confidenceUpper: 280, confidenceLevel: 0.90, unit: "%" },
        { label: "Revenue", predicted: 125000, confidenceLower: 110000, confidenceUpper: 140000, confidenceLevel: 0.85, unit: "$" },
      ];
    }
    return analyticsData.forecasts.slice(0, 3).map((f) => ({
      label: f.forecastType.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
      predicted: parseFloat(f.predictedValue as string),
      confidenceLower: parseFloat(f.confidenceLower as string),
      confidenceUpper: parseFloat(f.confidenceUpper as string),
      confidenceLevel: parseFloat(f.confidenceLevel as string),
      unit: f.forecastType === "revenue" ? "$" : "%",
    }));
  }, [analyticsData?.forecasts]);

  const kpis = analyticsData?.kpis || {
    conversionRate: 0,
    conversionRateTrend: 0,
    ctr: 0,
    ctrTrend: 0,
    roi: 0,
    roiTrend: 0,
    totalRevenue: 0,
    revenueTrend: 0,
    totalCost: 0,
    costTrend: 0,
    profitMargin: 0,
    profitTrend: 0,
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground mt-1">
          Deep dive into your campaign performance metrics
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <KpiCard
          title="Conversion Rate"
          value={`${kpis.conversionRate.toFixed(2)}%`}
          trend={kpis.conversionRateTrend}
          trendLabel="vs last period"
          icon={<Target className="h-5 w-5" />}
          isLoading={isLoading}
        />
        <KpiCard
          title="Click-Through Rate"
          value={`${kpis.ctr.toFixed(2)}%`}
          trend={kpis.ctrTrend}
          trendLabel="vs last period"
          icon={<MousePointer className="h-5 w-5" />}
          isLoading={isLoading}
        />
        <KpiCard
          title="Return on Investment"
          value={`${kpis.roi.toFixed(0)}%`}
          trend={kpis.roiTrend}
          trendLabel="vs last period"
          icon={<TrendingUp className="h-5 w-5" />}
          isLoading={isLoading}
        />
        <KpiCard
          title="Total Revenue"
          value={`$${kpis.totalRevenue.toLocaleString()}`}
          trend={kpis.revenueTrend}
          trendLabel="vs last period"
          icon={<DollarSign className="h-5 w-5" />}
          isLoading={isLoading}
        />
        <KpiCard
          title="Total Cost"
          value={`$${kpis.totalCost.toLocaleString()}`}
          trend={kpis.costTrend}
          trendLabel="vs last period"
          icon={<BarChart2 className="h-5 w-5" />}
          isLoading={isLoading}
        />
        <KpiCard
          title="Profit Margin"
          value={`${kpis.profitMargin.toFixed(1)}%`}
          trend={kpis.profitTrend}
          trendLabel="vs last period"
          icon={<PieChart className="h-5 w-5" />}
          isLoading={isLoading}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Conversion Rate Trend</CardTitle>
          <CardDescription>
            Track your conversion rate performance over the last 30 days
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ConversionRateChart data={conversionChartData} isLoading={isLoading} className="border-0 shadow-none" />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>CTR by Channel</CardTitle>
            <CardDescription>
              Compare click-through rates across marketing channels
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CTRComparisonChart data={ctrChartData} isLoading={isLoading} className="border-0 shadow-none" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Revenue Distribution</CardTitle>
            <CardDescription>
              Revenue breakdown by marketing channel
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ROIDistributionChart data={roiChartData} isLoading={isLoading} className="border-0 shadow-none" />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Revenue vs Cost</CardTitle>
              <CardDescription>
                Track your revenue and cost trends over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PerformanceOverTimeChart data={performanceChartData} isLoading={isLoading} className="border-0 shadow-none" />
            </CardContent>
          </Card>
        </div>
        <ForecastCard
          forecasts={forecastItems}
          modelVersion="v2.4.1"
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
