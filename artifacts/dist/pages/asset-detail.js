import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useGetAsset, getGetAssetQueryKey, useListAssetSensors, getListAssetSensorsQueryKey, useGetSensorReadings, getGetSensorReadingsQueryKey, useListAlerts, getListAlertsQueryKey, useListMaintenanceOrders, getListMaintenanceOrdersQueryKey, } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Thermometer, Gauge, Activity, Zap, Wind, Cpu, TrendingDown } from "lucide-react";
import { format, parseISO } from "date-fns";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Area, AreaChart } from "recharts";
async function fetchAssetPredictions(assetId) {
    const r = await fetch(`/api/assets/${assetId}/predictions`);
    if (!r.ok)
        throw new Error("Failed to load predictions");
    return r.json();
}
function RulHistoryChart({ predictions }) {
    const sorted = [...predictions].reverse();
    return (<ResponsiveContainer width="100%" height={200}>
      <AreaChart data={sorted} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="rulGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false}/>
        <XAxis dataKey="createdAt" tickFormatter={(v) => format(parseISO(v), "MMM d")} stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false}/>
        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} unit=" cyc"/>
        <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", borderRadius: "4px", fontSize: 12 }} labelFormatter={(v) => format(parseISO(v), "MMM d, HH:mm")} formatter={(v) => [`${v} cycles`, "RUL"]}/>
        <ReferenceLine y={100} stroke="hsl(35,100%,50%)" strokeDasharray="4 2" strokeWidth={1}/>
        <ReferenceLine y={40} stroke="hsl(0,63%,51%)" strokeDasharray="4 2" strokeWidth={1}/>
        <Area type="monotone" dataKey="rulValue" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#rulGrad)" dot={{ r: 3, fill: "hsl(var(--primary))" }} activeDot={{ r: 4 }}/>
      </AreaChart>
    </ResponsiveContainer>);
}
const SENSOR_ICONS = {
    temperature: Thermometer,
    vibration: Activity,
    pressure: Gauge,
    humidity: Wind,
    current: Zap,
    voltage: Zap,
    rpm: Cpu,
    flow_rate: Wind,
};
function SensorReadingsChart({ sensorId, minThreshold, maxThreshold, unit }) {
    const { data: readings, isLoading } = useGetSensorReadings(sensorId, {
        query: { queryKey: getGetSensorReadingsQueryKey(sensorId), enabled: true }
    });
    if (isLoading)
        return <Skeleton className="h-[220px] w-full"/>;
    const sorted = [...(readings ?? [])].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    return (<ResponsiveContainer width="100%" height={220}>
      <LineChart data={sorted} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false}/>
        <XAxis dataKey="timestamp" tickFormatter={(val) => format(parseISO(val), "HH:mm")} stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} interval={3}/>
        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} unit={` ${unit}`}/>
        <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", borderRadius: "4px", fontSize: 12 }} labelFormatter={(val) => format(parseISO(val), "MMM d, HH:mm")} formatter={(v) => [`${v.toFixed(2)} ${unit}`, "Value"]}/>
        <ReferenceLine y={maxThreshold} stroke="hsl(0, 63%, 51%)" strokeDasharray="4 2" strokeWidth={1} label={{ value: "MAX", fill: "hsl(0, 63%, 51%)", fontSize: 10, position: "right" }}/>
        <ReferenceLine y={minThreshold} stroke="hsl(35, 100%, 50%)" strokeDasharray="4 2" strokeWidth={1}/>
        <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={1.5} dot={false} activeDot={{ r: 3, fill: "hsl(var(--primary))" }}/>
      </LineChart>
    </ResponsiveContainer>);
}
export default function AssetDetail() {
    const params = useParams();
    const [, navigate] = useLocation();
    const id = Number(params.id);
    const [selectedSensor, setSelectedSensor] = useState(null);
    const { data: asset, isLoading: assetLoading } = useGetAsset(id, {
        query: { queryKey: getGetAssetQueryKey(id), enabled: !!id }
    });
    const { data: sensors, isLoading: sensorsLoading } = useListAssetSensors(id, {
        query: { queryKey: getListAssetSensorsQueryKey(id), enabled: !!id }
    });
    const { data: alerts } = useListAlerts({ assetId: id }, {
        query: { queryKey: getListAlertsQueryKey({ assetId: id }), enabled: !!id }
    });
    const { data: maintenanceOrders } = useListMaintenanceOrders({ assetId: id }, {
        query: { queryKey: getListMaintenanceOrdersQueryKey({ assetId: id }), enabled: !!id }
    });
    const { data: predictions = [] } = useQuery({
        queryKey: ["predictions", id],
        queryFn: () => fetchAssetPredictions(id),
        enabled: !!id,
    });
    const activeSensor = selectedSensor ?? (sensors?.[0]?.id ?? null);
    if (assetLoading) {
        return (<div className="space-y-4">
        <Skeleton className="h-8 w-64"/>
        <Skeleton className="h-40 w-full"/>
        <Skeleton className="h-64 w-full"/>
      </div>);
    }
    if (!asset) {
        return (<div className="text-center py-20">
        <p className="text-muted-foreground font-mono text-sm">Asset not found</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate("/assets")}>Back to Assets</Button>
      </div>);
    }
    const getHealthColor = (score) => score >= 80 ? "text-emerald-500" : score >= 50 ? "text-amber-500" : "text-destructive";
    return (<div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate("/assets")} data-testid="button-back">
          <ArrowLeft className="w-4 h-4"/>
        </Button>
        <div>
          <h1 className="text-xl font-bold tracking-tight">{asset.name}</h1>
          <div className="text-xs font-mono text-muted-foreground mt-0.5">{asset.type} — {asset.location}</div>
        </div>
        <div className="ml-auto flex gap-2">
          <StatusBadge status={asset.status}/>
        </div>
      </div>

      {/* Asset overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card/60 border-border/60">
          <CardContent className="p-4">
            <div className="text-xs font-mono uppercase text-muted-foreground tracking-widest">Health Score</div>
            <div className={`text-3xl font-bold font-mono mt-1 ${getHealthColor(asset.healthScore)}`}>
              {Math.round(asset.healthScore)}<span className="text-lg">%</span>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/60 border-border/60">
          <CardContent className="p-4">
            <div className="text-xs font-mono uppercase text-muted-foreground tracking-widest">Install Date</div>
            <div className="font-mono text-sm font-medium mt-1">{asset.installDate}</div>
          </CardContent>
        </Card>
        <Card className="bg-card/60 border-border/60">
          <CardContent className="p-4">
            <div className="text-xs font-mono uppercase text-muted-foreground tracking-widest">Last Maintenance</div>
            <div className="font-mono text-sm font-medium mt-1">{asset.lastMaintenanceDate ?? "—"}</div>
          </CardContent>
        </Card>
        <Card className="bg-card/60 border-border/60">
          <CardContent className="p-4">
            <div className="text-xs font-mono uppercase text-muted-foreground tracking-widest">Next Maintenance</div>
            <div className="font-mono text-sm font-medium mt-1">{asset.nextMaintenanceDate ?? "—"}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="sensors">
        <TabsList className="bg-secondary border border-border">
          <TabsTrigger value="sensors" className="font-mono text-xs">Sensors ({sensors?.length ?? 0})</TabsTrigger>
          <TabsTrigger value="alerts" className="font-mono text-xs">Alerts ({alerts?.length ?? 0})</TabsTrigger>
          <TabsTrigger value="maintenance" className="font-mono text-xs">Maintenance ({maintenanceOrders?.length ?? 0})</TabsTrigger>
          <TabsTrigger value="rul" className="font-mono text-xs">RUL History ({predictions.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="sensors" className="space-y-4 mt-4">
          {sensorsLoading ? (<div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24"/>)}
            </div>) : (<>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {sensors?.map((sensor) => {
                const Icon = SENSOR_ICONS[sensor.type] ?? Activity;
                const isSelected = activeSensor === sensor.id;
                const pct = Math.max(0, Math.min(100, ((sensor.currentValue - sensor.minThreshold) / (sensor.maxThreshold - sensor.minThreshold)) * 100));
                return (<Card key={sensor.id} onClick={() => setSelectedSensor(sensor.id)} className={`cursor-pointer transition-all border ${isSelected ? "border-primary bg-primary/5" : "bg-card/60 border-border/60 hover:border-primary/40"}`} data-testid={`card-sensor-${sensor.id}`}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <Icon className="w-4 h-4 text-muted-foreground"/>
                          <StatusBadge status={sensor.status}/>
                        </div>
                        <div className="font-medium text-xs mb-1 truncate">{sensor.name}</div>
                        <div className="font-mono font-bold text-lg">
                          {sensor.currentValue.toFixed(1)}
                          <span className="text-xs text-muted-foreground ml-1">{sensor.unit}</span>
                        </div>
                        <div className="mt-2 h-1 w-full bg-secondary rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${sensor.status === "critical" ? "bg-destructive" : sensor.status === "warning" ? "bg-amber-500" : "bg-primary"}`} style={{ width: `${pct}%` }}/>
                        </div>
                      </CardContent>
                    </Card>);
            })}
              </div>

              {activeSensor && sensors && sensors.length > 0 && (() => {
                const s = sensors.find((sx) => sx.id === activeSensor);
                if (!s)
                    return null;
                return (<Card className="bg-card/60 border-border/60">
                    <CardHeader>
                      <CardTitle className="text-sm font-mono">{s.name} — 24h Time Series</CardTitle>
                      <CardDescription className="text-xs font-mono">
                        Threshold: {s.minThreshold} – {s.maxThreshold} {s.unit}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <SensorReadingsChart sensorId={s.id} minThreshold={s.minThreshold} maxThreshold={s.maxThreshold} unit={s.unit}/>
                    </CardContent>
                  </Card>);
            })()}
            </>)}
        </TabsContent>

        <TabsContent value="alerts" className="mt-4">
          <Card className="bg-card/60 border-border/60 overflow-hidden">
            {!alerts?.length ? (<CardContent className="p-8 text-center text-muted-foreground font-mono text-sm">No alerts for this asset</CardContent>) : (<div className="divide-y divide-border/50">
                {alerts.map((a) => (<div key={a.id} className="p-4 flex items-start gap-3" data-testid={`row-alert-${a.id}`}>
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="font-medium text-sm">{a.title}</div>
                        <div className="flex gap-2 shrink-0">
                          <StatusBadge status={a.severity}/>
                          <StatusBadge status={a.status}/>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">{a.description}</div>
                      <div className="text-xs font-mono text-muted-foreground mt-2">
                        {format(parseISO(a.createdAt), "MMM d, yyyy HH:mm")}
                      </div>
                    </div>
                  </div>))}
              </div>)}
          </Card>
        </TabsContent>

        <TabsContent value="maintenance" className="mt-4">
          <Card className="bg-card/60 border-border/60 overflow-hidden">
            {!maintenanceOrders?.length ? (<CardContent className="p-8 text-center text-muted-foreground font-mono text-sm">No maintenance records for this asset</CardContent>) : (<div className="divide-y divide-border/50">
                {maintenanceOrders.map((m) => (<div key={m.id} className="p-4" data-testid={`row-maintenance-${m.id}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-medium text-sm">{m.title}</div>
                        <div className="text-xs text-muted-foreground mt-1">{m.description}</div>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <StatusBadge status={m.priority}/>
                        <StatusBadge status={m.status}/>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-xs font-mono text-muted-foreground">
                      <span className="capitalize">{m.type}</span>
                      <span>Scheduled: {m.scheduledDate}</span>
                      {m.assignedTo && <span>{m.assignedTo}</span>}
                    </div>
                  </div>))}
              </div>)}
          </Card>
        </TabsContent>

        <TabsContent value="rul" className="mt-4 space-y-4">
          {predictions.length === 0 ? (<Card className="bg-card/60 border-border/60">
              <CardContent className="p-8 text-center space-y-3">
                <TrendingDown className="w-8 h-8 text-muted-foreground/30 mx-auto"/>
                <p className="text-muted-foreground font-mono text-sm">No RUL predictions yet for this asset</p>
                <p className="text-xs text-muted-foreground">
                  Go to <span className="text-primary font-mono">RUL Predictor</span>, select this asset, and run a prediction to start tracking history.
                </p>
              </CardContent>
            </Card>) : (<>
              <Card className="bg-card/60 border-border/60">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-mono">RUL Trend</CardTitle>
                  <CardDescription className="text-xs">
                    Remaining Useful Life over time — dashed lines at 100 (warning) and 40 (critical)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <RulHistoryChart predictions={predictions}/>
                </CardContent>
              </Card>

              <Card className="bg-card/60 border-border/60 overflow-hidden">
                <div className="divide-y divide-border/50">
                  {predictions.map((p) => {
                const color = p.healthState === "healthy"
                    ? "text-emerald-400"
                    : p.healthState === "warning"
                        ? "text-amber-400"
                        : "text-red-400";
                return (<div key={p.id} className="px-4 py-3 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <span className={`text-2xl font-mono font-bold ${color}`}>{p.rulValue}</span>
                          <div>
                            <p className="text-xs text-muted-foreground font-mono">cycles remaining</p>
                            <p className="text-xs text-muted-foreground">{format(parseISO(p.createdAt), "MMM d, yyyy HH:mm")}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          {p.confidence !== null && (<div className="text-right">
                              <p className="text-xs font-mono font-semibold text-foreground">{p.confidence}%</p>
                              <p className="text-[10px] text-muted-foreground font-mono">confidence</p>
                            </div>)}
                          {p.std !== null && (<div className="text-right">
                              <p className="text-xs font-mono text-muted-foreground">±{p.std}</p>
                              <p className="text-[10px] text-muted-foreground font-mono">std dev</p>
                            </div>)}
                          <Badge variant="outline" className={`capitalize text-xs font-mono ${color} border-current`}>
                            {p.healthState}
                          </Badge>
                        </div>
                      </div>);
            })}
                </div>
              </Card>
            </>)}
        </TabsContent>
      </Tabs>
    </div>);
}
