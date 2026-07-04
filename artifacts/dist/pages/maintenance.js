import { useState } from "react";
import { useListMaintenanceOrders, getListMaintenanceOrdersQueryKey, useCreateMaintenanceOrder, useUpdateMaintenanceOrder, useListAssets, getListAssetsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Calendar, User, Clock, CheckCircle2 } from "lucide-react";
const createOrderSchema = z.object({
    assetId: z.string().min(1, "Asset is required"),
    title: z.string().min(1, "Title is required"),
    description: z.string().min(1, "Description is required"),
    type: z.enum(["preventive", "corrective", "predictive", "emergency"]),
    priority: z.enum(["low", "medium", "high", "critical"]),
    scheduledDate: z.string().min(1, "Scheduled date is required"),
    assignedTo: z.string().optional(),
    estimatedHours: z.string().optional(),
});
export default function Maintenance() {
    const [statusFilter, setStatusFilter] = useState("all");
    const [dialogOpen, setDialogOpen] = useState(false);
    const queryClient = useQueryClient();
    const params = {};
    if (statusFilter !== "all")
        params.status = statusFilter;
    const { data: orders, isLoading } = useListMaintenanceOrders(params, {
        query: { queryKey: getListMaintenanceOrdersQueryKey(params) }
    });
    const { data: assets } = useListAssets({}, { query: { queryKey: getListAssetsQueryKey({}) } });
    const createOrder = useCreateMaintenanceOrder({
        mutation: {
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: getListMaintenanceOrdersQueryKey() });
                setDialogOpen(false);
                form.reset();
            }
        }
    });
    const updateOrder = useUpdateMaintenanceOrder({
        mutation: {
            onSuccess: () => queryClient.invalidateQueries({ queryKey: getListMaintenanceOrdersQueryKey() })
        }
    });
    const form = useForm({
        resolver: zodResolver(createOrderSchema),
        defaultValues: { type: "preventive", priority: "medium", title: "", description: "", assetId: "", scheduledDate: "", assignedTo: "", estimatedHours: "" }
    });
    const onSubmit = (data) => {
        createOrder.mutate({
            data: {
                assetId: Number(data.assetId),
                title: data.title,
                description: data.description,
                type: data.type,
                priority: data.priority,
                scheduledDate: data.scheduledDate,
                assignedTo: data.assignedTo || undefined,
                estimatedHours: data.estimatedHours ? Number(data.estimatedHours) : undefined,
            }
        });
    };
    const handleStatusChange = (id, status) => {
        updateOrder.mutate({ id, data: { status } });
    };
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    const sorted = [...(orders ?? [])].sort((a, b) => (priorityOrder[a.priority] ?? 4) -
        (priorityOrder[b.priority] ?? 4));
    return (<div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Maintenance Orders</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="font-mono text-xs gap-1" data-testid="button-new-order">
              <Plus className="w-4 h-4"/> New Order
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-mono tracking-wide">New Work Order</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="assetId" render={({ field }) => (<FormItem>
                    <FormLabel className="text-xs font-mono uppercase text-muted-foreground">Asset</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-secondary border-border font-mono text-sm" data-testid="select-asset">
                          <SelectValue placeholder="Select asset"/>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {assets?.map((a) => <SelectItem key={a.id} value={String(a.id)}>{a.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>)}/>
                <FormField control={form.control} name="title" render={({ field }) => (<FormItem>
                    <FormLabel className="text-xs font-mono uppercase text-muted-foreground">Title</FormLabel>
                    <FormControl>
                      <Input {...field} className="bg-secondary border-border font-mono text-sm" data-testid="input-title"/>
                    </FormControl>
                    <FormMessage />
                  </FormItem>)}/>
                <FormField control={form.control} name="description" render={({ field }) => (<FormItem>
                    <FormLabel className="text-xs font-mono uppercase text-muted-foreground">Description</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={3} className="bg-secondary border-border font-mono text-sm resize-none" data-testid="textarea-description"/>
                    </FormControl>
                    <FormMessage />
                  </FormItem>)}/>
                <div className="grid grid-cols-2 gap-3">
                  <FormField control={form.control} name="type" render={({ field }) => (<FormItem>
                      <FormLabel className="text-xs font-mono uppercase text-muted-foreground">Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-secondary border-border font-mono text-sm" data-testid="select-type">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="preventive">Preventive</SelectItem>
                          <SelectItem value="corrective">Corrective</SelectItem>
                          <SelectItem value="predictive">Predictive</SelectItem>
                          <SelectItem value="emergency">Emergency</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>)}/>
                  <FormField control={form.control} name="priority" render={({ field }) => (<FormItem>
                      <FormLabel className="text-xs font-mono uppercase text-muted-foreground">Priority</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-secondary border-border font-mono text-sm" data-testid="select-priority">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="critical">Critical</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>)}/>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <FormField control={form.control} name="scheduledDate" render={({ field }) => (<FormItem>
                      <FormLabel className="text-xs font-mono uppercase text-muted-foreground">Scheduled Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} className="bg-secondary border-border font-mono text-sm" data-testid="input-date"/>
                      </FormControl>
                      <FormMessage />
                    </FormItem>)}/>
                  <FormField control={form.control} name="estimatedHours" render={({ field }) => (<FormItem>
                      <FormLabel className="text-xs font-mono uppercase text-muted-foreground">Est. Hours</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.5" {...field} className="bg-secondary border-border font-mono text-sm" data-testid="input-hours"/>
                      </FormControl>
                    </FormItem>)}/>
                </div>
                <FormField control={form.control} name="assignedTo" render={({ field }) => (<FormItem>
                    <FormLabel className="text-xs font-mono uppercase text-muted-foreground">Assigned To</FormLabel>
                    <FormControl>
                      <Input {...field} className="bg-secondary border-border font-mono text-sm" data-testid="input-assignee"/>
                    </FormControl>
                  </FormItem>)}/>
                <Button type="submit" className="w-full font-mono text-xs" disabled={createOrder.isPending} data-testid="button-submit-order">
                  {createOrder.isPending ? "Creating..." : "Create Work Order"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Select value={statusFilter} onValueChange={setStatusFilter}>
        <SelectTrigger className="w-44 bg-card border-border font-mono text-sm" data-testid="select-status-filter">
          <SelectValue placeholder="All statuses"/>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All statuses</SelectItem>
          <SelectItem value="scheduled">Scheduled</SelectItem>
          <SelectItem value="in_progress">In Progress</SelectItem>
          <SelectItem value="completed">Completed</SelectItem>
          <SelectItem value="cancelled">Cancelled</SelectItem>
        </SelectContent>
      </Select>

      {isLoading ? (<div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-md"/>)}
        </div>) : sorted.length === 0 ? (<div className="text-center py-20 text-muted-foreground font-mono text-sm">No maintenance orders found</div>) : (<Card className="bg-card/60 border-border/60 overflow-hidden">
          <div className="divide-y divide-border/50">
            {sorted.map((order) => (<div key={order.id} className="p-4 hover:bg-secondary/20 transition-colors" data-testid={`row-order-${order.id}`}>
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-medium text-sm">{order.title}</div>
                        <div className="text-xs text-muted-foreground mt-1">{order.description}</div>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <StatusBadge status={order.priority}/>
                        <StatusBadge status={order.status}/>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-3 text-xs font-mono text-muted-foreground flex-wrap">
                        <span className="text-primary">{order.assetName}</span>
                        <span className="capitalize text-muted-foreground">{order.type}</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3"/>
                          {order.scheduledDate}
                        </span>
                        {order.assignedTo && (<span className="flex items-center gap-1">
                            <User className="w-3 h-3"/>
                            {order.assignedTo}
                          </span>)}
                        {order.estimatedHours && (<span className="flex items-center gap-1">
                            <Clock className="w-3 h-3"/>
                            {order.estimatedHours}h
                          </span>)}
                      </div>
                      <div className="flex gap-2 shrink-0">
                        {order.status === "scheduled" && (<Button size="sm" variant="outline" className="h-7 text-xs font-mono border-blue-500/30 text-blue-500 hover:bg-blue-500/10" onClick={() => handleStatusChange(order.id, "in_progress")} data-testid={`button-start-${order.id}`}>
                            Start
                          </Button>)}
                        {order.status === "in_progress" && (<Button size="sm" variant="outline" className="h-7 text-xs font-mono border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10" onClick={() => handleStatusChange(order.id, "completed")} data-testid={`button-complete-${order.id}`}>
                            <CheckCircle2 className="w-3 h-3 mr-1"/> Complete
                          </Button>)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>))}
          </div>
        </Card>)}
    </div>);
}
