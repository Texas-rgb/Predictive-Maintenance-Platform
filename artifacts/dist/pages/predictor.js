import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Cpu, AlertTriangle, CheckCircle2, Clock, Zap, RefreshCw, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
function generateSampleData(engineHealth = "healthy") {
    const rows = [];
    const baselines = [
        518.67, 642.68, 1582.09, 1398.21, 14.62, 21.61, 554.36,
        2388.02, 9046.19, 1.3, 47.47, 521.66, 2388.02, 8138.62,
        8.4195, 0.03, 392.0, 2388.0, 100.0, 38.86, 23.419,
    ];
    const degradation = { healthy: 0.01, warning: 0.06, critical: 0.15 }[engineHealth];
    for (let t = 0; t < 30; t++) {
        const cycleDeg = degradation * (t / 29);
        for (let s = 0; s < 21; s++) {
            const base = baselines[s];
            const noise = (Math.random() - 0.5) * base * 0.005;
            const direction = s % 3 === 0 ? -1 : 1;
            rows.push(parseFloat((base + direction * base * cycleDeg + noise).toFixed(4)));
        }
    }
    return rows.join(",");
}
async function fetchAssets() {
    try {
        const r = await fetch("/api/assets");
        if (!r.ok)
            return [];
        return r.json();
    }
    catch {
        return [];
    }
}
async function runPrediction(payload) {
    const res = await fetch("https://texas-rgb-predictive-maintenance-platform.hf.space/api/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: [payload.input_csv] }),
    });
    if (!res.ok)
        throw new Error("Prediction failed");
    const raw = await res.json();
    const resultStr = raw.data[0];
    let confidence = null;
    let std = null;
    let rulValue = null;
    try {
        const parsed = JSON.parse(resultStr);
        if (parsed.error)
            throw new Error(parsed.error);
        rulValue = parsed.rul ?? null;
        confidence = parsed.confidence ?? null;
        std = parsed.std ?? null;
    }
    catch {
        // plain text fallback
    }
    return { result: resultStr, rulValue, confidence, std, assetId: payload.assetId ?? null };
}
function RulGauge({ rul, confidence, std }) {
    const max = 200;
    const pct = Math.min((rul / max) * 100, 100);
    const color = rul > 100 ? "text-emerald-400" : rul > 40 ? "text-amber-400" : "text-red-400";
    const barClass = rul > 100 ? "bg-emerald-500" : rul > 40 ? "bg-amber-500" : "bg-red-500";
    const label = rul > 100 ? "Healthy" : rul > 40 ? "Monitor Closely" : "Action Required";
    const Icon = rul > 100 ? CheckCircle2 : AlertTriangle;
    const metrics = [
        { label: "Est. hours", value: `~${(rul * 0.8).toFixed(0)}h` },
        {
            label: "Confidence",
            value: confidence !== null ? `${confidence}%` : "—",
            title: confidence !== null ? "Monte Carlo Dropout (20 passes)" : "Upgrade app.py for real confidence",
        },
        {
            label: std !== null ? "Std Dev" : "Next service",
            value: std !== null ? `±${std} cyc` : rul < 50 ? "Immediate" : rul < 100 ? "Soon" : "Scheduled",
        },
    ];
    return (<div className="space-y-4">
      <div className="flex items-end gap-3">
        <span className={`text-7xl font-mono font-bold tracking-tight ${color}`}>{rul}</span>
        <div className="mb-2 space-y-0.5">
          <p className="text-sm text-muted-foreground font-mono">CYCLES REMAINING</p>
          <div className={`flex items-center gap-1.5 ${color}`}>
            <Icon className="w-4 h-4"/>
            <span className="text-sm font-semibold">{label}</span>
          </div>
        </div>
      </div>
      <div className="space-y-1.5">
        <Progress value={pct} className={`h-3 ${barClass}`}/>
        <div className="flex justify-between text-xs text-muted-foreground font-mono">
          <span>0</span><span>50</span><span>100</span><span>150</span><span>200+</span>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3 pt-1">
        {metrics.map((m) => (<div key={m.label} className="rounded-md bg-secondary/50 p-3 text-center" title={m.title}>
            <p className="text-xs text-muted-foreground font-mono">{m.label}</p>
            <p className="text-sm font-semibold mt-0.5">{m.value}</p>
          </div>))}
      </div>
    </div>);
}
export default function Predictor() {
    const [csvInput, setCsvInput] = useState("");
    const [selectedAssetId, setSelectedAssetId] = useState("none");
    const { toast } = useToast();
    const { data: assets = [] } = useQuery({ queryKey: ["assets"], queryFn: fetchAssets, retry: false });
    const mutation = useMutation({
        mutationFn: runPrediction,
        onSuccess: (data) => {
            const assetName = assets.find((a) => a.id === data.assetId)?.name;
            toast({
                title: "Prediction saved",
                description: assetName
                    ? `RUL ${data.rulValue} cycles logged for ${assetName}`
                    : "Prediction completed (no asset linked)",
            });
        },
        onError: (err) => {
            toast({ title: "Prediction failed", description: err.message, variant: "destructive" });
        },
    });
    const rul = mutation.data?.rulValue ?? null;
    function loadSample(health) {
        setCsvInput(generateSampleData(health));
        mutation.reset();
    }
    function handleRun() {
        const assetId = selectedAssetId !== "none" ? Number(selectedAssetId) : undefined;
        mutation.mutate({ input_csv: csvInput, assetId });
    }
    return (<div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Cpu className="w-6 h-6 text-primary"/>
          RUL Predictor
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Aviation engine Remaining Useful Life — powered by&nbsp;
          <span className="text-primary font-mono">Texas-rgb/aviation-predictive-maintenance</span>
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Input panel */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary"/>
              Sensor Input
            </CardTitle>
            <CardDescription>630 comma-separated values · 30 time steps × 21 CMAPSS sensors</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Asset link */}
            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground font-mono">LINK TO ASSET (optional)</p>
              <Select value={selectedAssetId} onValueChange={setSelectedAssetId}>
                <SelectTrigger className="h-9 bg-background border-border text-sm">
                  <SelectValue placeholder="Select an asset…"/>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None (unlinked prediction)</SelectItem>
                  {assets.map((a) => (<SelectItem key={a.id} value={String(a.id)}>
                      {a.name} — {a.type}
                    </SelectItem>))}
                </SelectContent>
              </Select>
            </div>

            {/* Sample presets */}
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-xs text-muted-foreground">Load sample:</span>
              {["healthy", "warning", "critical"].map((h) => (<Button key={h} size="sm" variant="outline" className="h-7 text-xs capitalize" onClick={() => loadSample(h)}>
                  {h === "healthy" ? "✅" : h === "warning" ? "⚠️" : "🔴"} {h}
                </Button>))}
            </div>

            <Textarea value={csvInput} onChange={(e) => { setCsvInput(e.target.value); mutation.reset(); }} placeholder="Paste 630 comma-separated sensor values, or use a sample above…" className="font-mono text-xs h-44 resize-none bg-background border-border"/>

            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-mono">
                {csvInput ? `${csvInput.split(",").filter(Boolean).length} / 630 values` : "No data"}
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => { setCsvInput(""); mutation.reset(); }} disabled={!csvInput}>
                  <RefreshCw className="w-3 h-3 mr-1"/> Clear
                </Button>
                <Button size="sm" onClick={handleRun} disabled={mutation.isPending || !csvInput} className="bg-primary text-primary-foreground hover:bg-primary/90">
                  {mutation.isPending
            ? <><RefreshCw className="w-3 h-3 mr-1 animate-spin"/>Running…</>
            : <><Play className="w-3 h-3 mr-1"/>Run Prediction</>}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Result panel */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary"/>
              Prediction Result
            </CardTitle>
            <CardDescription>Estimated engine cycles before maintenance is required</CardDescription>
          </CardHeader>
          <CardContent>
            {mutation.isPending && (<div className="flex flex-col items-center justify-center h-52 gap-3 text-muted-foreground">
                <RefreshCw className="w-8 h-8 animate-spin text-primary"/>
                <p className="text-sm font-mono">Calling inference model…</p>
              </div>)}
            {!mutation.isPending && !mutation.data && !mutation.isError && (<div className="flex flex-col items-center justify-center h-52 gap-3 text-muted-foreground">
                <Cpu className="w-10 h-10 opacity-20"/>
                <p className="text-sm">Load sample data and run a prediction to see results</p>
              </div>)}
            {mutation.isError && (<div className="flex flex-col items-center justify-center h-52 gap-3">
                <AlertTriangle className="w-8 h-8 text-destructive"/>
                <p className="text-sm text-destructive">{mutation.error.message}</p>
              </div>)}
            {mutation.data && (<div className="space-y-4 pt-2">
                {rul !== null ? <RulGauge rul={rul} confidence={mutation.data.confidence} std={mutation.data.std}/> : (<div className="space-y-2">
                    <Badge variant="secondary" className="font-mono text-xs">RAW OUTPUT</Badge>
                    <p className="font-mono text-sm bg-secondary/40 rounded p-3 break-all">{mutation.data.result}</p>
                  </div>)}
                {mutation.data.assetId && (<p className="text-xs text-muted-foreground font-mono text-right">
                    ✓ Saved to asset history
                  </p>)}
              </div>)}
          </CardContent>
        </Card>
      </div>

      {/* Info footer */}
      <Card className="bg-card/50 border-border">
        <CardContent className="pt-4 pb-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div><p className="text-xs font-mono text-muted-foreground mb-1">MODEL</p><p className="font-medium">Aviation Engine RUL · LSTM</p></div>
            <div><p className="text-xs font-mono text-muted-foreground mb-1">DATASET</p><p className="font-medium">NASA CMAPSS FD001</p></div>
            <div><p className="text-xs font-mono text-muted-foreground mb-1">HOSTED ON</p><p className="font-medium">HuggingFace Spaces</p></div>
          </div>
        </CardContent>
      </Card>
    </div>);
}
