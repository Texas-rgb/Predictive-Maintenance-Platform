import { useState } from "react";
import { useListAlerts, getListAlertsQueryKey, useAcknowledgeAlert, useResolveAlert } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, CheckCircle2, Eye, Clock } from "lucide-react";
import { format, parseISO } from "date-fns";
export default function Alerts() {
    const [severityFilter, setSeverityFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");
    const queryClient = useQueryClient();
    const params = {};
    if (severityFilter !== "all")
        params.severity = severityFilter;
    if (statusFilter !== "all")
        params.status = statusFilter;
    const { data: alerts, isLoading } = useListAlerts(params, {
        query: { queryKey: getListAlertsQueryKey(params) }
    });
    const acknowledge = useAcknowledgeAlert({
        mutation: {
            onSuccess: () => queryClient.invalidateQueries({ queryKey: getListAlertsQueryKey() }),
        }
    });
    const resolve = useResolveAlert({
        mutation: {
            onSuccess: () => queryClient.invalidateQueries({ queryKey: getListAlertsQueryKey() }),
        }
    });
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    const sorted = [...(alerts ?? [])].sort((a, b) => (severityOrder[a.severity] ?? 4) -
        (severityOrder[b.severity] ?? 4));
    const counts = {
        critical: alerts?.filter((a) => a.severity === "critical" && a.status === "open").length ?? 0,
        open: alerts?.filter((a) => a.status === "open").length ?? 0,
        acknowledged: alerts?.filter((a) => a.status === "acknowledged").length ?? 0,
    };
    return (<div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Alert Center</h1>
        <div className="flex items-center gap-3 text-xs font-mono">
          {counts.critical > 0 && (<span className="flex items-center gap-1 text-destructive">
              <span className="w-2 h-2 rounded-full bg-destructive animate-pulse"/>
              {counts.critical} critical
            </span>)}
          <span className="text-muted-foreground">{counts.open} open</span>
        </div>
      </div>

      <div className="flex gap-3 flex-col sm:flex-row">
        <Select value={severityFilter} onValueChange={setSeverityFilter}>
          <SelectTrigger className="w-full sm:w-40 bg-card border-border font-mono text-sm" data-testid="select-severity-filter">
            <SelectValue placeholder="All severities"/>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All severities</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40 bg-card border-border font-mono text-sm" data-testid="select-status-filter">
            <SelectValue placeholder="All statuses"/>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="acknowledged">Acknowledged</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (<div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-md"/>)}
        </div>) : sorted.length === 0 ? (<div className="text-center py-20 text-muted-foreground font-mono text-sm">
          No alerts match your filters
        </div>) : (<Card className="bg-card/60 border-border/60 overflow-hidden">
          <div className="divide-y divide-border/50">
            {sorted.map((alert) => (<div key={alert.id} className="p-4 hover:bg-secondary/20 transition-colors" data-testid={`row-alert-${alert.id}`}>
                <div className="flex items-start gap-4">
                  <div className="mt-0.5 shrink-0">
                    {alert.severity === "critical" || alert.severity === "high" ? (<AlertTriangle className={`w-5 h-5 ${alert.severity === "critical" ? "text-destructive" : "text-amber-500"}`}/>) : (<Eye className="w-5 h-5 text-muted-foreground"/>)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-medium text-sm">{alert.title}</div>
                        <div className="text-xs text-muted-foreground mt-1">{alert.description}</div>
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <div className="flex gap-2">
                          <StatusBadge status={alert.severity}/>
                          <StatusBadge status={alert.status}/>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-3 text-xs font-mono text-muted-foreground">
                        <span className="text-primary">{alert.assetName}</span>
                        {alert.sensorName && <span>/ {alert.sensorName}</span>}
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3"/>
                          {format(parseISO(alert.createdAt), "MMM d, HH:mm")}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        {alert.status === "open" && (<Button size="sm" variant="outline" className="h-7 text-xs font-mono border-border" onClick={() => acknowledge.mutate({ id: alert.id })} disabled={acknowledge.isPending} data-testid={`button-acknowledge-${alert.id}`}>
                            Acknowledge
                          </Button>)}
                        {(alert.status === "open" || alert.status === "acknowledged") && (<Button size="sm" variant="outline" className="h-7 text-xs font-mono border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10" onClick={() => resolve.mutate({ id: alert.id })} disabled={resolve.isPending} data-testid={`button-resolve-${alert.id}`}>
                            <CheckCircle2 className="w-3 h-3 mr-1"/>
                            Resolve
                          </Button>)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>))}
          </div>
        </Card>)}
    </div>);
}
