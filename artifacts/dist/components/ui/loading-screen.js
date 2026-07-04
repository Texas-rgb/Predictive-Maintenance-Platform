import { Loader2 } from "lucide-react";
export function LoadingScreen({ message = "Loading..." }) {
    return (<div className="w-full h-full min-h-[400px] flex flex-col items-center justify-center text-muted-foreground">
      <Loader2 className="w-8 h-8 animate-spin text-primary mb-4"/>
      <div className="font-mono text-sm tracking-widest uppercase">{message}</div>
    </div>);
}
export function ErrorScreen({ error }) {
    return (<div className="w-full h-full min-h-[400px] flex flex-col items-center justify-center text-destructive">
      <div className="font-mono text-sm tracking-widest uppercase mb-2">System Error</div>
      <div className="text-muted-foreground text-sm max-w-md text-center">
        {error instanceof Error ? error.message : "An unexpected error occurred while fetching data."}
      </div>
    </div>);
}
