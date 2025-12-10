import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Sparkles, TrendingUp, Target, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";

interface ForecastItem {
  label: string;
  predicted: number;
  confidenceLower: number;
  confidenceUpper: number;
  confidenceLevel: number;
  unit?: string;
  icon?: React.ReactNode;
}

interface ForecastCardProps {
  forecasts: ForecastItem[];
  modelVersion?: string;
  isLoading?: boolean;
  className?: string;
}

export function ForecastCard({
  forecasts,
  modelVersion,
  isLoading = false,
  className,
}: ForecastCardProps) {
  const getIcon = (label: string) => {
    switch (label.toLowerCase()) {
      case "conversion rate":
        return <Target className="h-4 w-4" />;
      case "roi":
        return <TrendingUp className="h-4 w-4" />;
      case "revenue":
        return <DollarSign className="h-4 w-4" />;
      default:
        return <Sparkles className="h-4 w-4" />;
    }
  };

  const formatValue = (value: number, unit?: string) => {
    if (unit === "%") {
      return `${value.toFixed(2)}%`;
    }
    if (unit === "$") {
      return `$${value.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    }
    return value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  if (isLoading) {
    return (
      <Card className={cn("", className)}>
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-4">
          <div className="h-5 w-40 animate-pulse rounded bg-muted" />
          <div className="h-5 w-24 animate-pulse rounded bg-muted" />
        </CardHeader>
        <CardContent className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-32 animate-pulse rounded bg-muted" />
              <div className="h-8 w-24 animate-pulse rounded bg-muted" />
              <div className="h-2 w-full animate-pulse rounded bg-muted" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("", className)} data-testid="card-forecast">
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-chart-3" />
          <CardTitle className="text-lg font-semibold">
            Predictive Insights
          </CardTitle>
        </div>
        <Badge variant="secondary" className="text-xs bg-chart-3/10 text-chart-3 border-chart-3/20">
          Powered by AI
        </Badge>
      </CardHeader>
      <CardContent className="space-y-6">
        {forecasts.map((forecast, index) => (
          <div key={index} className="space-y-2" data-testid={`forecast-item-${forecast.label.toLowerCase().replace(/\s+/g, '-')}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {forecast.icon || getIcon(forecast.label)}
                <span>{forecast.label}</span>
              </div>
              <span className="text-xs text-muted-foreground">
                {(forecast.confidenceLevel * 100).toFixed(0)}% confidence
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono">
                {formatValue(forecast.predicted, forecast.unit)}
              </span>
              <span className="text-xs text-muted-foreground">
                ({formatValue(forecast.confidenceLower, forecast.unit)} - {formatValue(forecast.confidenceUpper, forecast.unit)})
              </span>
            </div>
            <Progress 
              value={forecast.confidenceLevel * 100} 
              className="h-1.5"
              aria-label={`Confidence level: ${(forecast.confidenceLevel * 100).toFixed(0)}%`}
            />
          </div>
        ))}
        {modelVersion && (
          <div className="pt-2 border-t text-xs text-muted-foreground">
            Model version: {modelVersion}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
