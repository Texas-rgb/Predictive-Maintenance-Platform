import { useGetAlertTrends, getGetAlertTrendsQueryKey, useGetAssetHealthBreakdown, getGetAssetHealthBreakdownQueryKey, useGetDashboardSummary, getGetDashboardSummaryQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { format, parseISO } from "date-fns";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
const PIE_COLORS = {
    healthy: "hsl(160, 70%, 45%)",
    warning: "hsl(35, 100%, 50%)",
    critical: "hsl(0, 63%, 51%)",
    offline: "hsl(215, 20%, 40%)"
};
export default function Analytics() {
    const { data: trends, isLoading: tLoading } = useGetAlertTrends({
        query: { queryKey: getGetAlertTrendsQueryKey() }
    });
    const { data: health, isLoading: hLoading } = useGetAssetHealthBreakdown({
        query: { queryKey: getGetAssetHealthBreakdownQueryKey() }
    });
    const { data: summary, isLoading: sLoading } = useGetDashboardSummary({
        query: { queryKey: getGetDashboardSummaryQueryKey() }
    });
    return (<div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
        <div className="text-xs font-mono text-muted-foreground">Last 30 days</div>
      </div>

      {/* KPI row */}
      {sLoading ? (<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-md"/>)}
        </div>) : summary && (<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
                { label: "Fleet Health", value: `${Math.round(summary.avgHealthScore)}%`, sub: "avg across all assets" },
                { label: "Open Alerts", value: summary.openAlerts, sub: `${summary.criticalAlerts} critical` },
                { label: "Scheduled Work", value: summary.scheduledMaintenance, sub: `${summary.overdueMaintenance} overdue` },
                { label: "Total Assets", value: summary.totalAssets, sub: `${summary.offlineAssets} offline` },
            ].map((kpi) => (<Card key={kpi.label} className="bg-card/60 border-border/60">
              <CardContent className="p-4">
                <div className="text-xs font-mono uppercase text-muted-foreground tracking-widest">{kpi.label}</div>
                <div className="text-3xl font-bold font-mono mt-1">{kpi.value}</div>
                <div className="text-xs text-muted-foreground mt-1">{kpi.sub}</div>
              </CardContent>
            </Card>))}
        </div>)}

      {/* Alert trend stacked bar */}
      <Card className="bg-card/60 border-border/60">
        <CardHeader>
          <CardTitle className="text-lg">Alert Volume by Severity</CardTitle>
          <CardDescription>Daily incident counts over the last 30 days</CardDescription>
        </CardHeader>
        <CardContent className="h-[280px]">
          {tLoading ? <Skeleton className="h-full w-full"/> : (<ResponsiveContainer width="100%" height="100%">
              <BarChart data={trends ?? []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barSize={6}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false}/>
                <XAxis dataKey="date" tickFormatter={(val) => format(parseISO(val), "MMM d")} stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} interval={4}/>
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false}/>
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", borderRadius: "4px" }} itemStyle={{ color: "hsl(var(--foreground))" }} labelFormatter={(val) => format(parseISO(val), "MMM d, yyyy")}/>
                <Legend wrapperStyle={{ fontSize: "11px", fontFamily: "monospace", paddingTop: "12px" }}/>
                <Bar dataKey="critical" stackId="a" fill="hsl(0, 63%, 51%)" radius={[0, 0, 0, 0]}/>
                <Bar dataKey="high" stackId="a" fill="hsl(35, 100%, 50%)"/>
                <Bar dataKey="medium" stackId="a" fill="hsl(217, 33%, 50%)"/>
                <Bar dataKey="low" stackId="a" fill="hsl(215, 20%, 40%)" radius={[2, 2, 0, 0]}/>
              </BarChart>
            </ResponsiveContainer>)}
        </CardContent>
      </Card>

      {/* Alert area trend + pie side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card/60 border-border/60">
          <CardHeader>
            <CardTitle className="text-lg">Alert Trend (Area)</CardTitle>
            <CardDescription>Critical + high severity over time</CardDescription>
          </CardHeader>
          <CardContent className="h-[220px]">
            {tLoading ? <Skeleton className="h-full w-full"/> : (<ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trends ?? []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gcrit" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(0, 63%, 51%)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(0, 63%, 51%)" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="ghigh" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(35, 100%, 50%)" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="hsl(35, 100%, 50%)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false}/>
                  <XAxis dataKey="date" tickFormatter={(val) => format(parseISO(val), "MMM d")} stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} interval={6}/>
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false}/>
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", borderRadius: "4px" }} labelFormatter={(v) => format(parseISO(v), "MMM d")}/>
                  <Area type="monotone" dataKey="critical" stroke="hsl(0, 63%, 51%)" fill="url(#gcrit)" strokeWidth={1.5}/>
                  <Area type="monotone" dataKey="high" stroke="hsl(35, 100%, 50%)" fill="url(#ghigh)" strokeWidth={1.5}/>
                </AreaChart>
              </ResponsiveContainer>)}
          </CardContent>
        </Card>

        <Card className="bg-card/60 border-border/60">
          <CardHeader>
            <CardTitle className="text-lg">Asset Health Distribution</CardTitle>
            <CardDescription>Current status across all equipment</CardDescription>
          </CardHeader>
          <CardContent className="h-[220px]">
            {hLoading ? <Skeleton className="h-full w-full"/> : (<ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={health ?? []} cx="40%" cy="50%" innerRadius={55} outerRadius={75} paddingAngle={3} dataKey="count" nameKey="status" stroke="none">
                    {(health ?? []).map((entry, i) => (<Cell key={i} fill={PIE_COLORS[entry.status] ?? PIE_COLORS.offline}/>))}
                  </Pie>
                  <Legend layout="vertical" align="right" verticalAlign="middle" wrapperStyle={{ fontSize: "11px", fontFamily: "monospace" }} formatter={(value) => <span className="capitalize">{value}</span>}/>
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", borderRadius: "4px" }} formatter={(value, name) => [value, String(name).charAt(0).toUpperCase() + String(name).slice(1)]}/>
                </PieChart>
              </ResponsiveContainer>)}
          </CardContent>
        </Card>
      </div>
    </div>);
}
