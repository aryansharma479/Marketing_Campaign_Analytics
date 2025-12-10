import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { cn } from "@/lib/utils";

interface ChartDataPoint {
  date: string;
  value: number;
  [key: string]: string | number;
}

interface ConversionChartProps {
  data: ChartDataPoint[];
  isLoading?: boolean;
  className?: string;
}

interface CTRChartProps {
  data: { name: string; ctr: number; impressions: number }[];
  isLoading?: boolean;
  className?: string;
}

interface ROIChartProps {
  data: { name: string; value: number; color?: string }[];
  isLoading?: boolean;
  className?: string;
}

interface PerformanceChartProps {
  data: ChartDataPoint[];
  isLoading?: boolean;
  className?: string;
}

const CHART_COLORS = [
  "hsl(217, 91%, 60%)",   // chart-1 (blue)
  "hsl(142, 76%, 36%)",   // chart-2 (green)
  "hsl(262, 83%, 58%)",   // chart-3 (purple)
  "hsl(34, 89%, 58%)",    // chart-4 (orange)
  "hsl(340, 82%, 52%)",   // chart-5 (pink)
];

const ChartSkeleton = ({ height = 300 }: { height?: number }) => (
  <div className="space-y-4">
    <Skeleton className="h-6 w-48" />
    <Skeleton style={{ height }} className="w-full" />
  </div>
);

export function ConversionRateChart({ data, isLoading, className }: ConversionChartProps) {
  if (isLoading) {
    return (
      <Card className={cn("", className)}>
        <CardContent className="pt-6">
          <ChartSkeleton height={350} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("", className)} data-testid="chart-conversion-rate">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">Conversion Rate Trend</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              className="text-muted-foreground"
            />
            <YAxis
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${value}%`}
              className="text-muted-foreground"
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--popover))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                color: "hsl(var(--popover-foreground))",
              }}
              formatter={(value: number) => [`${value.toFixed(2)}%`, "Conversion Rate"]}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="value"
              name="Conversion Rate"
              stroke={CHART_COLORS[0]}
              strokeWidth={2}
              dot={{ fill: CHART_COLORS[0], strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, strokeWidth: 0 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function CTRComparisonChart({ data, isLoading, className }: CTRChartProps) {
  if (isLoading) {
    return (
      <Card className={cn("", className)}>
        <CardContent className="pt-6">
          <ChartSkeleton height={300} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("", className)} data-testid="chart-ctr">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">CTR by Channel</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              className="text-muted-foreground"
            />
            <YAxis
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${value}%`}
              className="text-muted-foreground"
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--popover))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                color: "hsl(var(--popover-foreground))",
              }}
              formatter={(value: number, name: string) => [
                name === "ctr" ? `${value.toFixed(2)}%` : value.toLocaleString(),
                name === "ctr" ? "CTR" : "Impressions",
              ]}
            />
            <Legend />
            <Bar dataKey="ctr" name="CTR" fill={CHART_COLORS[1]} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function ROIDistributionChart({ data, isLoading, className }: ROIChartProps) {
  if (isLoading) {
    return (
      <Card className={cn("", className)}>
        <CardContent className="pt-6">
          <ChartSkeleton height={300} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("", className)} data-testid="chart-roi">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">ROI Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
              dataKey="value"
              nameKey="name"
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              labelLine={false}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color || CHART_COLORS[index % CHART_COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--popover))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                color: "hsl(var(--popover-foreground))",
              }}
              formatter={(value: number) => [`$${value.toLocaleString()}`, "Revenue"]}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function PerformanceOverTimeChart({ data, isLoading, className }: PerformanceChartProps) {
  if (isLoading) {
    return (
      <Card className={cn("", className)}>
        <CardContent className="pt-6">
          <ChartSkeleton height={300} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("", className)} data-testid="chart-performance">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">Campaign Performance Over Time</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={CHART_COLORS[0]} stopOpacity={0.3} />
                <stop offset="95%" stopColor={CHART_COLORS[0]} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={CHART_COLORS[4]} stopOpacity={0.3} />
                <stop offset="95%" stopColor={CHART_COLORS[4]} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              className="text-muted-foreground"
            />
            <YAxis
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              className="text-muted-foreground"
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--popover))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                color: "hsl(var(--popover-foreground))",
              }}
              formatter={(value: number) => [`$${value.toLocaleString()}`, ""]}
            />
            <Legend />
            <Area
              type="monotone"
              dataKey="revenue"
              name="Revenue"
              stroke={CHART_COLORS[0]}
              fillOpacity={1}
              fill="url(#colorRevenue)"
            />
            <Area
              type="monotone"
              dataKey="cost"
              name="Cost"
              stroke={CHART_COLORS[4]}
              fillOpacity={1}
              fill="url(#colorCost)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
