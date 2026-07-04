import { useState } from "react";
import { useListAssets, getListAssetsQueryKey } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, ChevronRight } from "lucide-react";
export default function Assets() {
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const { data: assets, isLoading } = useListAssets(statusFilter !== "all" ? { status: statusFilter } : {}, { query: { queryKey: getListAssetsQueryKey(statusFilter !== "all" ? { status: statusFilter } : {}) } });
    const filtered = assets?.filter((a) => search === "" ||
        a.name.toLowerCase().includes(search.toLowerCase()) ||
        a.type.toLowerCase().includes(search.toLowerCase()) ||
        a.location.toLowerCase().includes(search.toLowerCase())) ?? [];
    const getHealthColor = (score) => {
        if (score >= 80)
            return "bg-emerald-500";
        if (score >= 50)
            return "bg-amber-500";
        return "bg-destructive";
    };
    return (<div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Asset Fleet</h1>
        <div className="text-sm font-mono text-muted-foreground">{filtered.length} assets</div>
      </div>

      <div className="flex gap-3 flex-col sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"/>
          <Input placeholder="Search by name, type, or location..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 bg-card border-border font-mono text-sm" data-testid="input-asset-search"/>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-44 bg-card border-border font-mono text-sm" data-testid="select-status-filter">
            <SelectValue placeholder="All statuses"/>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="healthy">Healthy</SelectItem>
            <SelectItem value="warning">Warning</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="offline">Offline</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (<Skeleton key={i} className="h-40 rounded-md"/>))}
        </div>) : filtered.length === 0 ? (<div className="text-center py-20 text-muted-foreground font-mono text-sm">
          No assets match your filters
        </div>) : (<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((asset) => (<Link key={asset.id} href={`/assets/${asset.id}`}>
              <Card className="bg-card/60 border-border/60 hover:border-primary/40 hover:bg-card transition-all cursor-pointer group" data-testid={`card-asset-${asset.id}`}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="font-semibold text-sm group-hover:text-primary transition-colors">{asset.name}</div>
                      <div className="text-xs text-muted-foreground font-mono mt-0.5">{asset.type}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={asset.status}/>
                      <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"/>
                    </div>
                  </div>

                  <div className="space-y-2 mb-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground font-mono">HEALTH</span>
                      <span className="font-mono font-bold text-foreground">{Math.round(asset.healthScore)}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${getHealthColor(asset.healthScore)}`} style={{ width: `${asset.healthScore}%` }}/>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground font-mono">
                    <div className="truncate">{asset.location}</div>
                    {asset.manufacturer && <div className="truncate text-right">{asset.manufacturer}</div>}
                  </div>
                </CardContent>
              </Card>
            </Link>))}
        </div>)}
    </div>);
}
