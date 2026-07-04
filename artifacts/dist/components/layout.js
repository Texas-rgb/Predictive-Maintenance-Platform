import { Link, useLocation } from "wouter";
import { Activity, AlertTriangle, BarChart2, Database, Wrench, Settings, Bell, Cpu, History } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
const navItems = [
    { icon: Activity, label: "Dashboard", href: "/" },
    { icon: Database, label: "Assets", href: "/assets" },
    { icon: AlertTriangle, label: "Alerts", href: "/alerts" },
    { icon: Wrench, label: "Maintenance", href: "/maintenance" },
    { icon: BarChart2, label: "Analytics", href: "/analytics" },
    { icon: Cpu, label: "RUL Predictor", href: "/predict" },
    { icon: History, label: "Pred. History", href: "/predictions" },
];
export function Layout({ children }) {
    const [location] = useLocation();
    return (<div className="flex h-screen w-full overflow-hidden bg-background text-foreground selection:bg-primary/30">
      <aside className="w-64 border-r border-border bg-card flex flex-col hidden md:flex">
        <div className="h-16 flex items-center px-6 border-b border-border">
          <div className="flex items-center gap-2 text-primary font-bold tracking-wider">
            <Activity className="w-5 h-5"/>
            <span>PREDICTIVE<span className="text-foreground">OS</span></span>
          </div>
        </div>
        
        <div className="flex-1 py-4 overflow-y-auto px-3 flex flex-col gap-1">
          {navItems.map((item) => {
            const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
            return (<Link key={item.href} href={item.href}>
                <div className={cn("flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer", isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground")}>
                  <item.icon className="w-4 h-4"/>
                  {item.label}
                </div>
              </Link>);
        })}
        </div>
        
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground cursor-pointer transition-colors">
            <Settings className="w-4 h-4"/>
            System Config
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        <header className="h-16 border-b border-border bg-background/50 backdrop-blur-sm flex items-center justify-between px-6 shrink-0 z-10">
          <div className="flex items-center gap-4">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"/>
            <span className="text-sm font-mono text-muted-foreground tracking-widest uppercase">System Online</span>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
              <Bell className="w-4 h-4"/>
            </Button>
            <div className="w-8 h-8 rounded bg-secondary flex items-center justify-center text-sm font-medium">
              OP
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-auto p-6 md:p-8">
          <div className="max-w-7xl mx-auto h-full">
            {children}
          </div>
        </div>
      </main>
    </div>);
}
