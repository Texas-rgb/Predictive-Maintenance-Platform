import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/layout";
import Dashboard from "@/pages/dashboard";
import Assets from "@/pages/assets";
import AssetDetail from "@/pages/asset-detail";
import Alerts from "@/pages/alerts";
import Maintenance from "@/pages/maintenance";
import Analytics from "@/pages/analytics";
import Predictor from "@/pages/predictor";
import PredictionsHistory from "@/pages/predictions-history";
import NotFound from "@/pages/not-found";
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: 1,
            refetchOnWindowFocus: false,
        },
    },
});
function Router() {
    return (<Layout>
      <Switch>
        <Route path="/" component={Dashboard}/>
        <Route path="/assets" component={Assets}/>
        <Route path="/assets/:id" component={AssetDetail}/>
        <Route path="/alerts" component={Alerts}/>
        <Route path="/maintenance" component={Maintenance}/>
        <Route path="/analytics" component={Analytics}/>
        <Route path="/predict" component={Predictor}/>
        <Route path="/predictions" component={PredictionsHistory}/>
        <Route component={NotFound}/>
      </Switch>
    </Layout>);
}
function App() {
    return (<QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>);
}
export default App;
