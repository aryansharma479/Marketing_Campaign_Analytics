import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Eye,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Campaign } from "@shared/schema";
import { format } from "date-fns";

interface CampaignTableProps {
  campaigns: Campaign[];
  isLoading?: boolean;
  page: number;
  totalPages: number;
  totalItems: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  onSort: (column: string) => void;
  onPageChange: (page: number) => void;
  onView?: (campaign: Campaign) => void;
  onEdit?: (campaign: Campaign) => void;
  onDelete?: (campaign: Campaign) => void;
}

const statusColors: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  paused: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  completed: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  draft: "bg-gray-100 text-gray-600 dark:bg-gray-800/50 dark:text-gray-400",
};

const channelLabels: Record<string, string> = {
  email: "Email",
  social: "Social Media",
  ppc: "PPC",
  display: "Display Ads",
  affiliate: "Affiliate",
};

export function CampaignTable({
  campaigns,
  isLoading = false,
  page,
  totalPages,
  totalItems,
  sortBy,
  sortOrder,
  onSort,
  onPageChange,
  onView,
  onEdit,
  onDelete,
}: CampaignTableProps) {
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  const getSortIcon = (column: string) => {
    if (sortBy !== column) {
      return <ChevronsUpDown className="h-4 w-4 text-muted-foreground/50" />;
    }
    return sortOrder === "asc" ? (
      <ChevronUp className="h-4 w-4" />
    ) : (
      <ChevronDown className="h-4 w-4" />
    );
  };

  const SortableHeader = ({
    column,
    children,
    className,
  }: {
    column: string;
    children: React.ReactNode;
    className?: string;
  }) => (
    <TableHead className={cn("cursor-pointer select-none", className)}>
      <button
        onClick={() => onSort(column)}
        className="flex items-center gap-1 hover-elevate active-elevate-2 px-1 py-0.5 -mx-1 rounded"
        data-testid={`button-sort-${column}`}
      >
        {children}
        {getSortIcon(column)}
      </button>
    </TableHead>
  );

  const formatCurrency = (value: string | number) => {
    const num = typeof value === "string" ? parseFloat(value) : value;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  const startItem = (page - 1) * 10 + 1;
  const endItem = Math.min(page * 10, totalItems);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[250px]">Campaign Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Channel</TableHead>
                <TableHead>Budget</TableHead>
                <TableHead>Spent</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="flex items-center justify-between px-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-9 w-48" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4" data-testid="table-campaigns">
      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow>
              <SortableHeader column="name" className="w-[250px]">
                Campaign Name
              </SortableHeader>
              <SortableHeader column="status">Status</SortableHeader>
              <SortableHeader column="channel">Channel</SortableHeader>
              <SortableHeader column="budget">Budget</SortableHeader>
              <SortableHeader column="spent">Spent</SortableHeader>
              <SortableHeader column="startDate">Start Date</SortableHeader>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {campaigns.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                  No campaigns found
                </TableCell>
              </TableRow>
            ) : (
              campaigns.map((campaign) => (
                <TableRow
                  key={campaign.id}
                  onMouseEnter={() => setHoveredRow(campaign.id)}
                  onMouseLeave={() => setHoveredRow(null)}
                  className="group"
                  data-testid={`row-campaign-${campaign.id}`}
                >
                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                      <span>{campaign.name}</span>
                      {campaign.description && (
                        <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                          {campaign.description}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={cn("capitalize", statusColors[campaign.status] || "")}
                    >
                      {campaign.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {channelLabels[campaign.channel] || campaign.channel}
                  </TableCell>
                  <TableCell className="font-mono">
                    {formatCurrency(campaign.budget)}
                  </TableCell>
                  <TableCell className="font-mono">
                    {formatCurrency(campaign.spent)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {format(new Date(campaign.startDate), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell>
                    <div
                      className={cn(
                        "flex items-center gap-1 transition-opacity",
                        hoveredRow === campaign.id ? "opacity-100" : "opacity-0"
                      )}
                      style={{ visibility: hoveredRow === campaign.id ? "visible" : "hidden" }}
                    >
                      {onView && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onView(campaign)}
                          aria-label={`View ${campaign.name}`}
                          data-testid={`button-view-${campaign.id}`}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                      {onEdit && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onEdit(campaign)}
                          aria-label={`Edit ${campaign.name}`}
                          data-testid={`button-edit-${campaign.id}`}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      )}
                      {onDelete && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onDelete(campaign)}
                          aria-label={`Delete ${campaign.name}`}
                          data-testid={`button-delete-${campaign.id}`}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between px-2">
        <span className="text-sm text-muted-foreground" data-testid="text-pagination-info">
          Showing {startItem}-{endItem} of {totalItems} campaigns
        </span>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            aria-label="Previous page"
            data-testid="button-prev-page"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <div className="flex items-center gap-1 px-2">
            <span className="text-sm font-medium">{page}</span>
            <span className="text-sm text-muted-foreground">of {totalPages}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            aria-label="Next page"
            data-testid="button-next-page"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
