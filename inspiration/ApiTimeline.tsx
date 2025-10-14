import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Clock, Activity, ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";

export interface ApiRequest {
  id: string;
  status: number;
  method: string;
  endpoint: string;
  duration: number;
  startTime: number; // ms offset from trace start
  timestamp: string;
  children?: ApiRequest[];
  service?: string;
}

interface ApiTimelineProps {
  requests: ApiRequest[];
  traceStartTime?: number;
}

const getStatusColor = (status: number): string => {
  if (status >= 200 && status < 300) return "success";
  if (status >= 400 && status < 500) return "warning";
  if (status >= 500) return "destructive";
  return "secondary";
};

const getStatusVariant = (status: number): "default" | "secondary" | "destructive" | "outline" => {
  if (status >= 200 && status < 300) return "default";
  if (status >= 400 && status < 500) return "secondary";
  if (status >= 500) return "destructive";
  return "outline";
};

const RequestRow = ({
  request,
  depth = 0,
  totalDuration,
  index,
}: {
  request: ApiRequest;
  depth?: number;
  totalDuration: number;
  index: number;
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const statusColor = getStatusColor(request.status);
  const hasChildren = request.children && request.children.length > 0;

  // Calculate position and width percentages for the waterfall bar
  const leftPercent = (request.startTime / totalDuration) * 100;
  const widthPercent = (request.duration / totalDuration) * 100;

  const serviceColors: Record<string, string> = {
    java: "bg-success",
    python: "bg-primary",
    ruby: "bg-destructive",
    go: "bg-accent",
    default: "bg-muted",
  };

  const serviceColor = request.service ? serviceColors[request.service] || serviceColors.default : serviceColors.default;

  return (
    <div className="animate-in fade-in" style={{ animationDelay: `${index * 30}ms` }}>
      <div className="flex items-center border-b border-border/50 hover:bg-muted/30 transition-colors group">
        {/* Left section: Request info */}
        <div className="flex items-center gap-2 py-2 px-3 min-w-[400px]" style={{ paddingLeft: `${depth * 24 + 12}px` }}>
          {/* Expand/Collapse button */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="hover:bg-muted rounded p-0.5 transition-colors"
            style={{ visibility: hasChildren ? "visible" : "hidden" }}
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            )}
          </button>

          {/* Status Badge */}
          <Badge
            variant={getStatusVariant(request.status)}
            className={`font-mono text-xs min-w-[45px] justify-center ${
              statusColor === "success"
                ? "bg-success/20 text-success border-success/50"
                : statusColor === "warning"
                ? "bg-warning/20 text-warning border-warning/50"
                : statusColor === "destructive"
                ? "bg-destructive/20 text-destructive border-destructive/50"
                : ""
            }`}
          >
            {request.status}
          </Badge>

          {/* Method and Endpoint */}
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span className="font-mono text-xs font-semibold text-primary">
              {request.method}
            </span>
            <span className="font-mono text-xs text-foreground truncate">
              {request.endpoint}
            </span>
          </div>
        </div>

        {/* Right section: Waterfall timeline */}
        <div className="flex-1 py-2 px-3 relative h-full">
          <div className="relative h-6 w-full">
            {/* Waterfall bar */}
            <div
              className={`absolute h-full ${serviceColor} rounded opacity-80 group-hover:opacity-100 transition-opacity flex items-center px-2`}
              style={{
                left: `${leftPercent}%`,
                width: `${widthPercent}%`,
                minWidth: "2px",
              }}
            >
              <span className="font-mono text-xs text-background font-semibold whitespace-nowrap">
                {request.duration}ms
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div>
          {request.children!.map((child, idx) => (
            <RequestRow
              key={child.id}
              request={child}
              depth={depth + 1}
              totalDuration={totalDuration}
              index={index + idx + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const ApiTimeline = ({ requests, traceStartTime = 0 }: ApiTimelineProps) => {
  // Calculate total trace duration
  const totalDuration = Math.max(
    ...requests.map((r) => {
      const getMaxEndTime = (req: ApiRequest): number => {
        const endTime = req.startTime + req.duration;
        if (req.children && req.children.length > 0) {
          return Math.max(endTime, ...req.children.map(getMaxEndTime));
        }
        return endTime;
      };
      return getMaxEndTime(r);
    }),
    100
  );

  // Generate timeline markers
  const timelineMarkers = [];
  const step = Math.ceil(totalDuration / 10);
  for (let i = 0; i <= totalDuration; i += step) {
    timelineMarkers.push(i);
  }

  return (
    <Card className="bg-card border-border overflow-hidden">
      {/* Timeline Header */}
      <div className="flex border-b border-border">
        <div className="min-w-[400px] px-3 py-2 bg-muted/50">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Request
          </span>
        </div>
        <div className="flex-1 relative px-3 py-2 bg-muted/50">
          <div className="flex justify-between text-xs font-mono text-muted-foreground">
            {timelineMarkers.map((time) => (
              <span key={time}>{time}ms</span>
            ))}
          </div>
        </div>
      </div>

      {/* Timeline Grid */}
      <div className="relative">
        {/* Vertical grid lines */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="flex h-full" style={{ marginLeft: "400px" }}>
            {timelineMarkers.map((time, idx) => (
              <div
                key={time}
                className="flex-1 border-l border-border/30"
                style={{ marginLeft: idx === 0 ? "0" : undefined }}
              />
            ))}
          </div>
        </div>

        {/* Request rows */}
        <div className="relative">
          {requests.map((request, index) => (
            <RequestRow
              key={request.id}
              request={request}
              totalDuration={totalDuration}
              index={index}
            />
          ))}
        </div>
      </div>
    </Card>
  );
};
