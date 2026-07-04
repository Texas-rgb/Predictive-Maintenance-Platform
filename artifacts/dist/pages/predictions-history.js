import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { TrendingDown, Filter, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO } from "date-fns";
async function fetchPredictions() {
    const r = await fetch("/api/predictions");
    if (!r.ok)
        throw new Error("Failed to load predictions");
    return r.json();
}
async function fetchAssets() {
    const r = await fetch("/api/assets");
    if (!r.ok)
        throw new Error("Failed to load assets");
    return r.json();
}
async function deletePrediction(id) {
    const r = await fetch(`/api/predictions/${id}`, { method: "DELETE" });
    if (!r.ok)
        throw new Error("Failed to delete prediction");
}
function healthColor(state) {
    if (state === "healthy")
        return "text-emerald-400";
    if (state === "warning")
        return "text-amber-400";
    return "text-red-400";
}
function healthBarClass(state) {
    if (state === "healthy")
        return "bg-emerald-500";
    if (state === "warning")
        return "bg-amber-500";
    return "bg-red-500";
}
export default function PredictionsHistory() {
    const [, navigate] = useLocation();
    const [healthFilter, setHealthFilter] = useState("all");
    const [assetFilter, setAssetFilter] = useState("all");
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const { data: predictions = [], isLoading: predsLoading } = useQuery({
        queryKey: ["predictions"],
        queryFn: fetchPredictions,
    });
    const { data: assets = [] } = useQuery({
        queryKey: ["assets"],
        queryFn: fetchAssets,
    });
    const deleteMutation = useMutation({
        mutationFn: deletePrediction,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["predictions"] });
            toast({ title: "Prediction deleted" });
            setConfirmDeleteId(null);
        },
        onError: () => {
            toast({ title: "Delete failed", description: "Could not delete the prediction.", variant: "destructive" });
            setConfirmDeleteId(null);
        },
    });
    const assetMap = new Map(assets.map((a) => [a.id, a]));
    const filtered = predictions.filter((p) => {
        if (healthFilter !== "all" && p.healthState !== healthFilter)
            return false;
        if (assetFilter === "unlinked" && p.assetId !== null)
            return false;
        if (assetFilter !== "all" && assetFilter !== "unlinked" && String(p.assetId) !== assetFilter)
            return false;
        return true;
    });
    const counts = {
        healthy: predictions.filter((p) => p.healthState === "healthy").length,
        warning: predictions.filter((p) => p.healthState === "warning").length,
        critical: predictions.filter((p) => p.healthState === "critical").length,
    };
    const avgRul = predictions.length
        ? Math.round(predictions.reduce((s, p) => s + p.rulValue, 0) / predictions.length)
        : null;
    const pendingId = confirmDeleteId;
    const pendingPrediction = pendingId !== null ? predictions.find((p) => p.id === pendingId) : null;
    const pendingAsset = pendingPrediction?.assetId ? assetMap.get(pendingPrediction.assetId) : null;
    return (<div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <TrendingDown className="w-6 h-6 text-primary"/>
            Prediction History
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            All RUL predictions across every asset
          </p>
        </div>
        <Button variant="outline" size="sm" className="font-mono text-xs" onClick={() => navigate("/predict")}>
          + New Prediction
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card/60 border-border/60">
          <CardContent className="p-4">
            <p className="text-xs font-mono uppercase text-muted-foreground tracking-widest">Total</p>
            <p className="text-3xl font-bold font-mono mt-1">{predictions.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-card/60 border-border/60">
          <CardContent className="p-4">
            <p className="text-xs font-mono uppercase text-muted-foreground tracking-widest">Avg RUL</p>
            <p className="text-3xl font-bold font-mono mt-1 text-primary">{avgRul ?? "—"}</p>
          </CardContent>
        </Card>
        <Card className="bg-card/60 border-border/60">
          <CardContent className="p-4">
            <p className="text-xs font-mono uppercase text-muted-foreground tracking-widest">Critical</p>
            <p className="text-3xl font-bold font-mono mt-1 text-red-400">{counts.critical}</p>
          </CardContent>
        </Card>
        <Card className="bg-card/60 border-border/60">
          <CardContent className="p-4">
            <p className="text-xs font-mono uppercase text-muted-foreground tracking-widest">Warning</p>
            <p className="text-3xl font-bold font-mono mt-1 text-amber-400">{counts.warning}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <Filter className="w-4 h-4 text-muted-foreground"/>
        <Select value={healthFilter} onValueChange={setHealthFilter}>
          <SelectTrigger className="w-40 bg-card border-border font-mono text-sm h-9">
            <SelectValue placeholder="Health state"/>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All states</SelectItem>
            <SelectItem value="healthy">Healthy</SelectItem>
            <SelectItem value="warning">Warning</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
          </SelectContent>
        </Select>
        <Select value={assetFilter} onValueChange={setAssetFilter}>
          <SelectTrigger className="w-48 bg-card border-border font-mono text-sm h-9">
            <SelectValue placeholder="All assets"/>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All assets</SelectItem>
            <SelectItem value="unlinked">Unlinked</SelectItem>
            {assets.map((a) => (<SelectItem key={a.id} value={String(a.id)}>
                {a.name}
              </SelectItem>))}
          </SelectContent>
        </Select>
        {(healthFilter !== "all" || assetFilter !== "all") && (<Button variant="ghost" size="sm" className="text-xs font-mono text-muted-foreground h-9" onClick={() => { setHealthFilter("all"); setAssetFilter("all"); }}>
            Clear filters
          </Button>)}
        <span className="ml-auto text-xs font-mono text-muted-foreground">
          {filtered.length} of {predictions.length} predictions
        </span>
      </div>

      {/* Table */}
      {predsLoading ? (<div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-md"/>)}
        </div>) : filtered.length === 0 ? (<div className="text-center py-20 text-muted-foreground font-mono text-sm">
          No predictions match your filters
        </div>) : (<Card className="bg-card/60 border-border/60 overflow-hidden">
          {/* Header row */}
          <div className="grid grid-cols-12 gap-2 px-4 py-2 border-b border-border/50 text-[10px] font-mono uppercase text-muted-foreground tracking-widest">
            <div className="col-span-1">RUL</div>
            <div className="col-span-3">Asset</div>
            <div className="col-span-2">State</div>
            <div className="col-span-2">Confidence</div>
            <div className="col-span-2">Std Dev</div>
            <div className="col-span-1">When</div>
            <div className="col-span-1"/>
          </div>
          <div className="divide-y divide-border/50">
            {filtered.map((p) => {
                const color = healthColor(p.healthState);
                const barClass = healthBarClass(p.healthState);
                const asset = p.assetId ? assetMap.get(p.assetId) : null;
                const pct = Math.min((p.rulValue / 200) * 100, 100);
                return (<div key={p.id} className="grid grid-cols-12 gap-2 px-4 py-3 items-center hover:bg-secondary/20 transition-colors group">
                  {/* RUL value + mini bar */}
                  <div className="col-span-1">
                    <span className={`text-lg font-mono font-bold ${color}`}>{p.rulValue}</span>
                    <div className="mt-1 h-1 w-full bg-secondary rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${barClass}`} style={{ width: `${pct}%` }}/>
                    </div>
                  </div>

                  {/* Asset */}
                  <div className="col-span-3 min-w-0">
                    {asset ? (<button className="text-left group/link" onClick={() => navigate(`/assets/${asset.id}`)}>
                        <p className="text-sm font-medium truncate group-hover/link:text-primary transition-colors">
                          {asset.name}
                        </p>
                        <p className="text-xs text-muted-foreground font-mono truncate">{asset.type}</p>
                      </button>) : (<p className="text-sm text-muted-foreground font-mono italic">Unlinked</p>)}
                  </div>

                  {/* Health state badge */}
                  <div className="col-span-2">
                    <Badge variant="outline" className={`capitalize text-xs font-mono ${color} border-current`}>
                      {p.healthState}
                    </Badge>
                  </div>

                  {/* Confidence */}
                  <div className="col-span-2">
                    {p.confidence !== null ? (<div>
                        <p className="text-sm font-mono font-semibold">{p.confidence}%</p>
                        <p className="text-[10px] text-muted-foreground font-mono">confidence</p>
                      </div>) : (<p className="text-sm font-mono text-muted-foreground">—</p>)}
                  </div>

                  {/* Std dev */}
                  <div className="col-span-2">
                    {p.std !== null ? (<div>
                        <p className="text-sm font-mono text-muted-foreground">±{p.std}</p>
                        <p className="text-[10px] text-muted-foreground font-mono">std dev</p>
                      </div>) : (<p className="text-sm font-mono text-muted-foreground">—</p>)}
                  </div>

                  {/* Timestamp */}
                  <div className="col-span-1">
                    <p className="text-xs font-mono text-muted-foreground">
                      {format(parseISO(p.createdAt), "MMM d")}
                    </p>
                    <p className="text-[10px] text-muted-foreground font-mono">
                      {format(parseISO(p.createdAt), "HH:mm")}
                    </p>
                  </div>

                  {/* Delete button */}
                  <div className="col-span-1 flex justify-end">
                    <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => setConfirmDeleteId(p.id)} data-testid={`button-delete-prediction-${p.id}`}>
                      <Trash2 className="w-3.5 h-3.5"/>
                    </Button>
                  </div>
                </div>);
            })}
          </div>
        </Card>)}

      {/* Confirm delete dialog */}
      <AlertDialog open={confirmDeleteId !== null} onOpenChange={(open) => { if (!open)
        setConfirmDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete prediction?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingPrediction && (<>
                  RUL <span className="font-mono font-semibold">{pendingPrediction.rulValue}</span> cycles
                  {pendingAsset ? <> for <span className="font-semibold">{pendingAsset.name}</span></> : " (unlinked)"}
                  {" "}recorded on {pendingPrediction && format(parseISO(pendingPrediction.createdAt), "MMM d, yyyy HH:mm")}.
                  <br />
                </>)}
              This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => { if (confirmDeleteId !== null)
        deleteMutation.mutate(confirmDeleteId); }} disabled={deleteMutation.isPending}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>);
}
