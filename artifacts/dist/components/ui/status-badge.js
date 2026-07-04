import { Badge } from "@/components/ui/badge";
export function StatusBadge({ status, className }) {
    const getVariant = (s) => {
        switch (s.toLowerCase()) {
            case "healthy":
            case "normal":
            case "completed":
            case "resolved":
                return "default"; // Will style via classes
            case "warning":
            case "medium":
            case "scheduled":
            case "acknowledged":
                return "secondary";
            case "critical":
            case "high":
            case "open":
                return "destructive";
            case "offline":
            case "in_progress":
            case "low":
            case "cancelled":
                return "outline";
            default:
                return "outline";
        }
    };
    const getColorClasses = (s) => {
        switch (s.toLowerCase()) {
            case "healthy":
            case "normal":
            case "completed":
            case "resolved":
                return "bg-emerald-500/15 text-emerald-500 hover:bg-emerald-500/25 border-emerald-500/20";
            case "warning":
            case "medium":
            case "acknowledged":
                return "bg-amber-500/15 text-amber-500 hover:bg-amber-500/25 border-amber-500/20";
            case "critical":
            case "high":
            case "open":
                return "bg-destructive/15 text-destructive hover:bg-destructive/25 border-destructive/20";
            case "scheduled":
            case "in_progress":
                return "bg-blue-500/15 text-blue-500 hover:bg-blue-500/25 border-blue-500/20";
            case "low":
                return "bg-slate-500/15 text-slate-500 hover:bg-slate-500/25 border-slate-500/20";
            case "offline":
            case "cancelled":
            default:
                return "bg-muted text-muted-foreground hover:bg-muted/80 border-muted-foreground/20";
        }
    };
    return (<Badge variant="outline" className={`capitalize font-mono tracking-widest text-[10px] px-2 py-0.5 rounded-sm ${getColorClasses(status)} ${className || ""}`}>
      {status.replace("_", " ")}
    </Badge>);
}
