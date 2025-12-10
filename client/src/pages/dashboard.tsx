import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { KpiCard } from "@/components/kpi-card";
import { ForecastCard } from "@/components/forecast-card";
import { CampaignTable } from "@/components/campaign-table";
import { FiltersPanel, type FilterValues } from "@/components/filters-panel";
import {
  ConversionRateChart,
  CTRComparisonChart,
  ROIDistributionChart,
  PerformanceOverTimeChart,
} from "@/components/dashboard-charts";
import {
  RefreshCw,
  Download,
  Target,
  MousePointer,
  DollarSign,
  Users,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import type { Campaign, KpiSummary, Forecast, CampaignMetric } from "@shared/schema";

interface DashboardData {
  kpis: {
    conversionRate: number;
    conversionRateTrend: number;
    ctr: number;
    ctrTrend: number;
    roi: number;
    roiTrend: number;
    totalImpressions: number;
    impressionsTrend: number;
  };
  campaigns: {
    items: Campaign[];
    total: number;
    page: number;
    totalPages: number;
  };
  metrics: CampaignMetric[];
  forecasts: Forecast[];
}

const defaultFilters: FilterValues = {
  search: "",
  status: "all",
  channel: "all",
  startDate: undefined,
  endDate: undefined,
};

export default function DashboardPage() {
  const { token } = useAuth();
  const [filters, setFilters] = useState<FilterValues>(defaultFilters);
  const [appliedFilters, setAppliedFilters] = useState<FilterValues>(defaultFilters);
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<string>("startDate");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const buildQueryParams = () => {
    const params = new URLSearchParams();
    params.set("page", page.toString());
    params.set("limit", "10");
    params.set("sortBy", sortBy);
    params.set("sortOrder", sortOrder);

    if (appliedFilters.search) params.set("search", appliedFilters.search);
    if (appliedFilters.status && appliedFilters.status !== "all") {
      params.set("status", appliedFilters.status);
    }
    if (appliedFilters.channel && appliedFilters.channel !== "all") {
      params.set("channel", appliedFilters.channel);
    }
    if (appliedFilters.startDate) {
      params.set("startDate", appliedFilters.startDate.toISOString());
    }
    if (appliedFilters.endDate) {
      params.set("endDate", appliedFilters.endDate.toISOString());
    }

    return params.toString();
  };

  const { data: dashboardData, isLoading, refetch } = useQuery<DashboardData>({
    queryKey: ["/api/dashboard", buildQueryParams()],
    enabled: !!token,
  });

  const handleApplyFilters = () => {
    setAppliedFilters(filters);
    setPage(1);
  };

  const handleResetFilters = () => {
    setFilters(defaultFilters);
    setAppliedFilters(defaultFilters);
    setPage(1);
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("desc");
    }
  };

  const conversionChartData = useMemo(() => {
    if (!dashboardData?.metrics) return [];
    const sortedMetrics = [...dashboardData.metrics].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    return sortedMetrics.slice(-30).map((m) => ({
      date: new Date(m.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      value: m.clicks > 0 ? (m.conversions / m.clicks) * 100 : 0,
    }));
  }, [dashboardData?.metrics]);

  const ctrChartData = useMemo(() => {
    if (!dashboardData?.metrics || !dashboardData?.campaigns?.items) return [];
    const channelData: Record<string, { impressions: number; clicks: number }> = {};
    
    dashboardData.campaigns.items.forEach((campaign) => {
      if (!channelData[campaign.channel]) {
        channelData[campaign.channel] = { impressions: 0, clicks: 0 };
      }
    });

    dashboardData.metrics.forEach((m) => {
      const campaign = dashboardData.campaigns.items.find((c) => c.id === m.campaignId);
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
  }, [dashboardData?.metrics, dashboardData?.campaigns?.items]);

  const roiChartData = useMemo(() => {
    if (!dashboardData?.metrics || !dashboardData?.campaigns?.items) return [];
    const channelRevenue: Record<string, number> = {};

    dashboardData.metrics.forEach((m) => {
      const campaign = dashboardData.campaigns.items.find((c) => c.id === m.campaignId);
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
  }, [dashboardData?.metrics, dashboardData?.campaigns?.items]);

  const performanceChartData = useMemo(() => {
    if (!dashboardData?.metrics) return [];
    const sortedMetrics = [...dashboardData.metrics].sort(
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
  }, [dashboardData?.metrics]);

  const forecastItems = useMemo(() => {
    if (!dashboardData?.forecasts?.length) {
      return [
        { label: "Conversion Rate", predicted: 3.45, confidenceLower: 2.9, confidenceUpper: 4.0, confidenceLevel: 0.95, unit: "%" },
        { label: "ROI", predicted: 245, confidenceLower: 210, confidenceUpper: 280, confidenceLevel: 0.90, unit: "%" },
        { label: "Revenue", predicted: 125000, confidenceLower: 110000, confidenceUpper: 140000, confidenceLevel: 0.85, unit: "$" },
      ];
    }
    return dashboardData.forecasts.slice(0, 3).map((f) => ({
      label: f.forecastType.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
      predicted: parseFloat(f.predictedValue as string),
      confidenceLower: parseFloat(f.confidenceLower as string),
      confidenceUpper: parseFloat(f.confidenceUpper as string),
      confidenceLevel: parseFloat(f.confidenceLevel as string),
      unit: f.forecastType === "revenue" ? "$" : "%",
    }));
  }, [dashboardData?.forecasts]);

  const kpis = dashboardData?.kpis || {
    conversionRate: 0,
    conversionRateTrend: 0,
    ctr: 0,
    ctrTrend: 0,
    roi: 0,
    roiTrend: 0,
    totalImpressions: 0,
    impressionsTrend: 0,
  };

  const handleExport = () => {
    if (!dashboardData?.campaigns?.items) return;

    const campaigns = dashboardData.campaigns.items;
    const headers = ["Name", "Status", "Channel", "Budget", "Spent", "Start Date", "End Date"];
    const csvRows = [
      headers.join(","),
      ...campaigns.map((c) => [
        `"${c.name}"`,
        c.status,
        c.channel,
        c.budget,
        c.spent,
        new Date(c.startDate).toLocaleDateString(),
        c.endDate ? new Date(c.endDate).toLocaleDateString() : "N/A",
      ].join(",")),
    ];

    const csvContent = csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `campaign-analytics-${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Campaign Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Monitor your marketing performance and AI-powered insights
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            onClick={() => refetch()}
            disabled={isLoading}
            data-testid="button-refresh"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button variant="outline" data-testid="button-export" onClick={handleExport} disabled={!dashboardData?.campaigns?.items?.length}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <FiltersPanel
        filters={filters}
        onFiltersChange={setFilters}
        onApply={handleApplyFilters}
        onReset={handleResetFilters}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
          icon={<DollarSign className="h-5 w-5" />}
          isLoading={isLoading}
        />
        <KpiCard
          title="Total Impressions"
          value={kpis.totalImpressions.toLocaleString()}
          trend={kpis.impressionsTrend}
          trendLabel="vs last period"
          icon={<Users className="h-5 w-5" />}
          isLoading={isLoading}
        />
      </div>

      <ConversionRateChart data={conversionChartData} isLoading={isLoading} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CTRComparisonChart data={ctrChartData} isLoading={isLoading} />
        <ROIDistributionChart data={roiChartData} isLoading={isLoading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <PerformanceOverTimeChart data={performanceChartData} isLoading={isLoading} />
        </div>
        <ForecastCard
          forecasts={forecastItems}
          modelVersion="v2.4.1"
          isLoading={isLoading}
        />
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Campaign Performance</h2>
        <CampaignTable
          campaigns={dashboardData?.campaigns?.items || []}
          isLoading={isLoading}
          page={page}
          totalPages={dashboardData?.campaigns?.totalPages || 1}
          totalItems={dashboardData?.campaigns?.total || 0}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={handleSort}
          onPageChange={setPage}
        />
      </div>
    </div>
  );
}
