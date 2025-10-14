import { ApiTimeline, ApiRequest } from "@/components/ApiTimeline";
import { Card } from "@/components/ui/card";
import { Activity } from "lucide-react";

const sampleRequests: ApiRequest[] = [
  {
    id: "1",
    status: 200,
    method: "GET",
    endpoint: "/api/customers",
    duration: 41,
    startTime: 0,
    timestamp: "2025-10-11 13:43:12",
    service: "java",
    children: [
      {
        id: "1.1",
        status: 200,
        method: "GET",
        endpoint: "/api/versions",
        duration: 36,
        startTime: 2,
        timestamp: "2025-10-11 13:43:12",
        service: "python",
        children: [
          {
            id: "1.1.1",
            status: 200,
            method: "GET",
            endpoint: "/api/config",
            duration: 28,
            startTime: 6,
            timestamp: "2025-10-11 13:43:12",
            service: "python",
            children: [
              {
                id: "1.1.1.1",
                status: 200,
                method: "GET",
                endpoint: "/api/settings",
                duration: 17,
                startTime: 10,
                timestamp: "2025-10-11 13:43:12",
                service: "ruby",
                children: [
                  {
                    id: "1.1.1.1.1",
                    status: 200,
                    method: "GET",
                    endpoint: "/api/cache",
                    duration: 14,
                    startTime: 12,
                    timestamp: "2025-10-11 13:43:12",
                    service: "ruby",
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "2",
    status: 200,
    method: "POST",
    endpoint: "/api/orders",
    duration: 65,
    startTime: 45,
    timestamp: "2025-10-11 13:43:13",
    service: "java",
    children: [
      {
        id: "2.1",
        status: 200,
        method: "GET",
        endpoint: "/api/inventory",
        duration: 22,
        startTime: 48,
        timestamp: "2025-10-11 13:43:13",
        service: "go",
      },
      {
        id: "2.2",
        status: 200,
        method: "POST",
        endpoint: "/api/payments",
        duration: 38,
        startTime: 72,
        timestamp: "2025-10-11 13:43:13",
        service: "python",
        children: [
          {
            id: "2.2.1",
            status: 200,
            method: "GET",
            endpoint: "/api/stripe/validate",
            duration: 30,
            startTime: 76,
            timestamp: "2025-10-11 13:43:13",
            service: "python",
          },
        ],
      },
    ],
  },
  {
    id: "3",
    status: 502,
    method: "GET",
    endpoint: "/api/versions",
    duration: 0,
    startTime: 115,
    timestamp: "2025-10-11 13:35:24",
    service: "python",
  },
];

const Index = () => {
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Activity className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">API Request Timeline</h1>
          </div>
          <p className="text-muted-foreground">
            Visualize and trace your API requests in chronological order
          </p>
        </div>

        {/* Stats Card */}
        <Card className="p-6 bg-card border-border">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Spans</p>
              <p className="text-2xl font-bold text-foreground">
                {(() => {
                  const countRequests = (reqs: ApiRequest[]): number => {
                    return reqs.reduce((acc, r) => {
                      return acc + 1 + (r.children ? countRequests(r.children) : 0);
                    }, 0);
                  };
                  return countRequests(sampleRequests);
                })()}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Success</p>
              <p className="text-2xl font-bold text-success">
                {(() => {
                  const countByStatus = (reqs: ApiRequest[], min: number, max: number): number => {
                    return reqs.reduce((acc, r) => {
                      const count = r.status >= min && r.status < max ? 1 : 0;
                      const childCount = r.children ? countByStatus(r.children, min, max) : 0;
                      return acc + count + childCount;
                    }, 0);
                  };
                  return countByStatus(sampleRequests, 200, 300);
                })()}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Errors</p>
              <p className="text-2xl font-bold text-destructive">
                {(() => {
                  const countByStatus = (reqs: ApiRequest[], min: number): number => {
                    return reqs.reduce((acc, r) => {
                      const count = r.status >= min ? 1 : 0;
                      const childCount = r.children ? countByStatus(r.children, min) : 0;
                      return acc + count + childCount;
                    }, 0);
                  };
                  return countByStatus(sampleRequests, 500);
                })()}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Trace Duration</p>
              <p className="text-2xl font-bold text-foreground">
                {(() => {
                  const getMaxEndTime = (reqs: ApiRequest[]): number => {
                    return Math.max(
                      ...reqs.map((r) => {
                        const endTime = r.startTime + r.duration;
                        const childMax = r.children ? getMaxEndTime(r.children) : 0;
                        return Math.max(endTime, childMax);
                      })
                    );
                  };
                  return getMaxEndTime(sampleRequests);
                })()}
                <span className="text-sm text-muted-foreground ml-1">ms</span>
              </p>
            </div>
          </div>
        </Card>

        {/* Timeline */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Trace Timeline</h2>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-success rounded" />
                <span className="text-muted-foreground">Java</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-primary rounded" />
                <span className="text-muted-foreground">Python</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-destructive rounded" />
                <span className="text-muted-foreground">Ruby</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-accent rounded" />
                <span className="text-muted-foreground">Go</span>
              </div>
            </div>
          </div>
          <ApiTimeline requests={sampleRequests} />
        </div>
      </div>
    </div>
  );
};

export default Index;
