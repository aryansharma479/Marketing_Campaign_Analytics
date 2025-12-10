import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ChevronDown, ChevronUp, Filter, Search, Calendar as CalendarIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

export interface FilterValues {
  search: string;
  status: string;
  channel: string;
  startDate: Date | undefined;
  endDate: Date | undefined;
}

interface FiltersPanelProps {
  filters: FilterValues;
  onFiltersChange: (filters: FilterValues) => void;
  onApply: () => void;
  onReset: () => void;
  isCollapsible?: boolean;
  defaultOpen?: boolean;
}

const statusOptions = [
  { value: "all", label: "All Statuses" },
  { value: "active", label: "Active" },
  { value: "paused", label: "Paused" },
  { value: "completed", label: "Completed" },
  { value: "draft", label: "Draft" },
];

const channelOptions = [
  { value: "all", label: "All Channels" },
  { value: "email", label: "Email" },
  { value: "social", label: "Social Media" },
  { value: "ppc", label: "PPC" },
  { value: "display", label: "Display Ads" },
  { value: "affiliate", label: "Affiliate" },
];

export function FiltersPanel({
  filters,
  onFiltersChange,
  onApply,
  onReset,
  isCollapsible = true,
  defaultOpen = true,
}: FiltersPanelProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const updateFilter = <K extends keyof FilterValues>(key: K, value: FilterValues[K]) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const hasActiveFilters =
    filters.search ||
    (filters.status && filters.status !== "all") ||
    (filters.channel && filters.channel !== "all") ||
    filters.startDate ||
    filters.endDate;

  const FilterContent = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="space-y-2">
        <Label htmlFor="search" className="text-sm font-medium">
          Search
        </Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="search"
            placeholder="Search campaigns..."
            value={filters.search}
            onChange={(e) => updateFilter("search", e.target.value)}
            className="pl-9"
            data-testid="input-search"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="status" className="text-sm font-medium">
          Status
        </Label>
        <Select
          value={filters.status || "all"}
          onValueChange={(value) => updateFilter("status", value)}
        >
          <SelectTrigger id="status" data-testid="select-status">
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="channel" className="text-sm font-medium">
          Channel
        </Label>
        <Select
          value={filters.channel || "all"}
          onValueChange={(value) => updateFilter("channel", value)}
        >
          <SelectTrigger id="channel" data-testid="select-channel">
            <SelectValue placeholder="Select channel" />
          </SelectTrigger>
          <SelectContent>
            {channelOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">Date Range</Label>
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "flex-1 justify-start text-left font-normal",
                  !filters.startDate && "text-muted-foreground"
                )}
                data-testid="button-start-date"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filters.startDate ? format(filters.startDate, "MMM d") : "Start"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={filters.startDate}
                onSelect={(date) => updateFilter("startDate", date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <span className="text-muted-foreground">-</span>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "flex-1 justify-start text-left font-normal",
                  !filters.endDate && "text-muted-foreground"
                )}
                data-testid="button-end-date"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filters.endDate ? format(filters.endDate, "MMM d") : "End"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={filters.endDate}
                onSelect={(date) => updateFilter("endDate", date)}
                disabled={(date) =>
                  filters.startDate ? date < filters.startDate : false
                }
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="flex items-end gap-2 lg:col-span-4">
        <Button onClick={onApply} className="gap-2" data-testid="button-apply-filters">
          <Filter className="h-4 w-4" />
          Apply Filters
        </Button>
        {hasActiveFilters && (
          <Button variant="outline" onClick={onReset} className="gap-2" data-testid="button-reset-filters">
            <X className="h-4 w-4" />
            Reset
          </Button>
        )}
      </div>
    </div>
  );

  if (!isCollapsible) {
    return (
      <div className="p-4 border rounded-lg bg-card" data-testid="panel-filters">
        <FilterContent />
      </div>
    );
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} data-testid="panel-filters">
      <div className="p-4 border rounded-lg bg-card">
        <CollapsibleTrigger asChild>
          <button className="flex items-center justify-between w-full text-left">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Filters</span>
              {hasActiveFilters && (
                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                  Active
                </span>
              )}
            </div>
            {isOpen ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-4">
          <FilterContent />
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
