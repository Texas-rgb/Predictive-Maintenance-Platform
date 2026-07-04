import { useGetDashboardSummary, getGetDashboardSummaryQueryKey, useGetAlertTrends, getGetAlertTrendsQueryKey, useGetAssetHealthBreakdown, getGetAssetHealthBreakdownQueryKey, useGetRecentActivity, getGetRecentActivityQueryKey } from "@workspace/api-client-react";
export default function Dashboard() {
    const { data: summary, isLoading: isLoadingSummary, error: errorSummary } = useGetDashboardSummary({
        query: { queryKey: getGetDashboardSummaryQueryKey() }
    });
    const { data: trends, isLoading: isLoadingTrends } = useGetAlertTrends({
        query: { queryKey: getGetAlertTrendsQueryKey() }
    });
    const { data: health, isLoading: isLoadingHealth } = useGetAssetHealthBreakdown({
        query: { queryKey: getGetAssetHealthBreakdownQueryKey() }
    });
    const { data: activity, isLoading: isLoadingActivity } = useGetRecentActivity({ limit: 10 }, {
        query: { queryKey: getGetRecentActivityQueryKey({ limit: 10 }) }
    }, ~);
}
;
if (isLoadingSummary || isLoadingTrends || isLoadingHealth || isLoadingActivity) {
    return <LoadingScreen message="Initializing Dashboard..."/>;
}
if (errorSummary || !summary) {
    return <ErrorScreen error={errorSummary}/>;
}
const PIE_COLORS = {
    healthy: "hsl(var(--primary))",
    warning: "hsl(var(--chart-3))",
    critical: "hsl(var(--destructive))",
    offline: "hsl(var(--muted-foreground))"
};
return (<div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Fleet Overview</h1>
        <div className="text-sm font-mono text-muted-foreground flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse"/>
          Live Data Active
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium tracking-wide uppercase text-muted-foreground">Total Assets</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground"/>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-mono">{summary.totalAssets}</div>
            <div className="mt-1 flex items-center text-xs text-muted-foreground gap-2">
              <span className="text-emerald-500 font-medium">{summary.healthyAssets} healthy</span>
              <span>•</span>
              <span className="text-destructive font-medium">{summary.criticalAssets} critical</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium tracking-wide uppercase text-muted-foreground">Avg Health Score</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground"/>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-mono">{Math.round(summary.avgHealthScore)}<span className="text-lg text-muted-foreground">%</span></div>
            <div className="mt-1 flex items-center text-xs text-muted-foreground">
              Across all monitored equipment
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium tracking-wide uppercase text-muted-foreground">Open Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive"/>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-mono text-destructive">{summary.openAlerts}</div>
            <div className="mt-1 flex items-center text-xs text-muted-foreground gap-2">
              <span className="text-destructive font-medium">{summary.criticalAlerts} critical</span>
              <span>•</span>
              <span>Require action</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium tracking-wide uppercase text-muted-foreground">Maintenance</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground"/>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-mono">{summary.scheduledMaintenance}</div>
            <div className="mt-1 flex items-center text-xs text-muted-foreground gap-2">
              {summary.overdueMaintenance > 0 ? (<span className="text-amber-500 font-medium">{summary.overdueMaintenance} overdue</span>) : (<span className="text-emerald-500 font-medium">All on schedule</span>)}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="col-span-1 lg:col-span-2 bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">Alert Trends</CardTitle>
            <CardDescription>30-day incident volume by severity</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            {trends && trends.length > 0 ? (<ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCritical" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorHigh" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--chart-3))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--chart-3))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false}/>
                  <XAxis dataKey="date" tickFormatter={(val) => format(parseISO(val), "MMM d")} stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} dy={10}/>
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false}/>
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '4px' }} itemStyle={{ color: 'hsl(var(--foreground))' }} labelFormatter={(val) => format(parseISO(val), "MMM d, yyyy")}/>
                  <Area type="monotone" dataKey="critical" stackId="1" stroke="hsl(var(--destructive))" fill="url(#colorCritical)"/>
                  <Area type="monotone" dataKey="high" stackId="1" stroke="hsl(var(--chart-3))" fill="url(#colorHigh)"/>
                  <Area type="monotone" dataKey="medium" stackId="1" stroke="hsl(var(--chart-4))" fill="transparent"/>
                  <Area type="monotone" dataKey="low" stackId="1" stroke="hsl(var(--muted-foreground))" fill="transparent"/>
                </AreaChart>
              </ResponsiveContainer>) : (<div className="h-full flex items-center justify-center text-muted-foreground text-sm font-mono">No trend data available</div>)}
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">Health Breakdown</CardTitle>
            <CardDescription>Current asset status distribution</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] flex flex-col items-center justify-center">
            {health && health.length > 0 ? (<ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={health} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={2} dataKey="count" nameKey="status" stroke="none">
                    {health.map((entry, index) => (<Cell key={`cell-${index}`} fill={PIE_COLORS[entry.status] || PIE_COLORS.offline}/>))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '4px', border: '1px solid hsl(var(--border))' }} itemStyle={{ color: 'hsl(var(--foreground))' }}/>
                </PieChart>
              </ResponsiveContainer>) : (<div className="text-muted-foreground text-sm font-mono">No health data</div>)}
            
            <div className="grid grid-cols-2 gap-4 w-full mt-4">
              {health?.map(h => (<div key={h.status} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PIE_COLORS[h.status] }}/>
                  <div className="flex-1 text-sm capitalize text-muted-foreground">{h.status}</div>
                  <div className="font-mono text-sm font-medium">{h.count}</div>
                </div>))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card/50 border-border/50 overflow-hidden">
        <CardHeader className="border-b border-border/50 bg-card/80">
          <CardTitle className="text-lg">System Activity Log</CardTitle>
          <CardDescription>Real-time events from all monitored assets</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {activity && activity.length > 0 ? (<div className="divide-y divide-border/50">
              {activity.map(item => (<div key={item.id} className="p-4 hover:bg-secondary/30 transition-colors flex gap-4">
                  <div className="mt-1">
                    {item.severity === 'critical' ? (<XCircle className="w-5 h-5 text-destructive"/>) : item.type === 'alert_resolved' || item.type === 'maintenance_completed' ? (<CheckCircle2 className="w-5 h-5 text-emerald-500"/>) : (<Activity className="w-5 h-5 text-primary"/>)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div className="font-medium text-sm">{item.title}</div>
                      <div className="text-xs font-mono text-muted-foreground whitespace-nowrap">
                        {format(parseISO(item.timestamp), "HH:mm:ss")}
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {item.description}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className="text-[10px] uppercase font-mono tracking-wider text-muted-foreground border-border">
                        {item.type.replace(/_/g, ' ')}
                      </Badge>
                      {item.assetName && (<span className="text-xs text-primary font-mono">{item.assetName}</span>)}
                    </div>
                  </div>
                </div>))}
            </div>) : (<div className="p-8 text-center text-muted-foreground font-mono text-sm">
              No recent activity
            </div>)}
        </CardContent>
      </Card>
    </div>);
