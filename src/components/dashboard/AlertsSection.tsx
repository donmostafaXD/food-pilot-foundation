import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useActivity } from "@/contexts/ActivityContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, AlertCircle, Info, CheckCircle2 } from "lucide-react";

interface Alert {
  id: string;
  message: string;
  severity: "critical" | "warning" | "info";
  type: string;
  priority: number; // lower = higher priority
}

interface Props {
  branchId: string | null;
}

const AlertsSection = ({ branchId }: Props) => {
  const { profile } = useAuth();
  const { activeActivity } = useActivity();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  const activityName = activeActivity?.activity_name ?? null;

  useEffect(() => {
    if (!profile?.organization_id || !branchId) {
      setLoading(false);
      return;
    }

    const load = async () => {
      setLoading(true);
      const orgId = profile.organization_id!;
      const today = new Date().toISOString().split("T")[0];
      const generated: Alert[] = [];

      // Get process steps for scoped queries
      let processSteps: string[] = [];
      if (activityName) {
        const { data: mapping } = await supabase
          .from("activity_process_map")
          .select("process")
          .eq("activity", activityName);
        processSteps = (mapping || []).map((m) => m.process);
      }

      // 1. CCP failures (highest priority)
      let devQuery = supabase
        .from("log_entries")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", orgId)
        .eq("branch_id", branchId)
        .eq("status", "Deviation");
      if (processSteps.length > 0) devQuery = devQuery.in("process_step", processSteps);

      const { count: deviationCount } = await devQuery;

      if (deviationCount && deviationCount > 0) {
        generated.push({
          id: "ccp-fail",
          message: `${deviationCount} CCP deviation${deviationCount > 1 ? "s" : ""} recorded`,
          severity: "critical",
          type: "CCP Failure",
          priority: 1,
        });
      }

      // 2. Overdue corrective actions (second priority)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      let overdueQuery = supabase
        .from("log_entries")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", orgId)
        .eq("branch_id", branchId)
        .eq("status", "Deviation")
        .lt("created_at", sevenDaysAgo.toISOString());
      if (processSteps.length > 0) overdueQuery = overdueQuery.in("process_step", processSteps);

      const { count: overdueCount } = await overdueQuery;

      if (overdueCount && overdueCount > 0) {
        generated.push({
          id: "overdue-ca",
          message: `${overdueCount} overdue corrective action${overdueCount > 1 ? "s" : ""} (>7 days)`,
          severity: "critical",
          type: "Overdue CA",
          priority: 2,
        });
      }

      // 3. Missing logs today (third priority)
      let todayQuery = supabase
        .from("log_entries")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", orgId)
        .eq("branch_id", branchId)
        .gte("created_at", `${today}T00:00:00`);
      if (processSteps.length > 0) todayQuery = todayQuery.in("process_step", processSteps);

      const { count: todayLogs } = await todayQuery;

      if ((todayLogs ?? 0) === 0) {
        generated.push({
          id: "no-logs",
          message: "No logs recorded today – monitoring may be incomplete",
          severity: "warning",
          type: "Missing Logs",
          priority: 3,
        });
      }

      // 4. HACCP plan existence check (info)
      let planQuery = supabase
        .from("haccp_plans")
        .select("id")
        .eq("organization_id", orgId)
        .eq("branch_id", branchId)
        .limit(1);
      if (activityName) planQuery = planQuery.eq("activity_name", activityName);

      const { data: plans } = await planQuery;

      if (!plans || plans.length === 0) {
        generated.push({
          id: "no-plan",
          message: "No HACCP plan created for this activity",
          severity: "warning",
          type: "Setup Required",
          priority: 4,
        });
      }

      // Sort by priority (CCP failures first, then overdue CA, then missing logs)
      generated.sort((a, b) => a.priority - b.priority);
      setAlerts(generated);
      setLoading(false);
    };

    load();
  }, [profile?.organization_id, branchId, activityName]);

  // Empty state: show a positive "all clear" message
  if (!loading && alerts.length === 0) {
    return (
      <Card className="shadow-sm border-l-4 border-l-accent/50">
        <CardContent className="flex items-center gap-3 py-4">
          <div className="p-2 rounded-full bg-accent/10">
            <CheckCircle2 className="h-4 w-4 text-accent" />
          </div>
          <p className="text-sm text-muted-foreground">No alerts at this time</p>
        </CardContent>
      </Card>
    );
  }

  if (loading) return null;

  const severityConfig = {
    critical: { icon: AlertCircle, bg: "bg-destructive/10", text: "text-destructive", badge: "destructive" as const },
    warning: { icon: AlertTriangle, bg: "bg-yellow-500/10", text: "text-yellow-600 dark:text-yellow-400", badge: "secondary" as const },
    info: { icon: Info, bg: "bg-primary/10", text: "text-primary", badge: "outline" as const },
  };

  return (
    <Card className="shadow-sm border-l-4 border-l-destructive/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          Alerts ({alerts.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {alerts.map((alert) => {
          const config = severityConfig[alert.severity];
          const Icon = config.icon;
          return (
            <div key={alert.id} className={`flex items-start gap-3 p-2.5 rounded-lg ${config.bg}`}>
              <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${config.text}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground">{alert.message}</p>
              </div>
              <Badge variant={config.badge} className="text-[10px] shrink-0">
                {alert.type}
              </Badge>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default AlertsSection;
