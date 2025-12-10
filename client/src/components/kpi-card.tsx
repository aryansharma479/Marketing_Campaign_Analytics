import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: number;
  trendLabel?: string;
  icon?: React.ReactNode;
  isLoading?: boolean;
  className?: string;
}

export function KpiCard({
  title,
  value,
  subtitle,
  trend,
  trendLabel,
  icon,
  isLoading = false,
  className,
}: KpiCardProps) {
  const getTrendIcon = () => {
    if (trend === undefined || trend === 0) return <Minus className="h-3 w-3" />;
    return trend > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />;
  };

  const getTrendColor = () => {
    if (trend === undefined || trend === 0) return "bg-muted text-muted-foreground";
    return trend > 0 
      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" 
      : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
  };

  if (isLoading) {
    return (
      <Card className={cn("min-h-32", className)}>
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
          <div className="h-4 w-24 animate-pulse rounded bg-muted" />
          <div className="h-6 w-6 animate-pulse rounded bg-muted" />
        </CardHeader>
        <CardContent>
          <div className="h-10 w-32 animate-pulse rounded bg-muted mb-2" />
          <div className="h-3 w-20 animate-pulse rounded bg-muted" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("min-h-32 transition-shadow", className)} data-testid={`card-kpi-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {icon && (
          <div className="h-6 w-6 text-muted-foreground flex items-center justify-center">
            {icon}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-2">
          <span className="text-4xl font-bold font-mono tracking-tight" data-testid={`text-kpi-value-${title.toLowerCase().replace(/\s+/g, '-')}`}>
            {value}
          </span>
          <div className="flex items-center gap-2 flex-wrap">
            {trend !== undefined && (
              <Badge
                variant="secondary"
                className={cn("text-xs font-medium gap-1", getTrendColor())}
                data-testid={`badge-trend-${title.toLowerCase().replace(/\s+/g, '-')}`}
              >
                {getTrendIcon()}
                {Math.abs(trend).toFixed(1)}%
              </Badge>
            )}
            {(subtitle || trendLabel) && (
              <span className="text-xs text-muted-foreground">
                {trendLabel || subtitle}
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
