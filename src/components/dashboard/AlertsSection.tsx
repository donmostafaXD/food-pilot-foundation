import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, AlertCircle, Info } from "lucide-react";

interface Alert {
  id: string;
  message: string;
  severity: "critical" | "warning" | "info";
  type: string;
}

interface Props {
  branchId: string | null;
}

const AlertsSection = ({ branchId }: Props) => {
  const { profile } = useAuth();
  const [alerts, setAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    if (!profile?.organization_id || !branchId) return;

    const load = async () => {
      const orgId = profile.organization_id!;
      const today = new Date().toISOString().split("T")[0];
      const generated: Alert[] = [];

      // Check for deviations (CCP failures)
      const { count: deviationCount } = await supabase
        .from("log_entries")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", orgId)
        .eq("branch_id", branchId)
        .eq("status", "Deviation");

      if (deviationCount && deviationCount > 0) {
        generated.push({
          id: "ccp-fail",
          message: `${deviationCount} CCP deviation${deviationCount > 1 ? "s" : ""} recorded`,
          severity: "critical",
          type: "CCP Failure",
        });
      }

      // Check for low log activity today
      const { count: todayLogs } = await supabase
        .from("log_entries")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", orgId)
        .eq("branch_id", branchId)
        .gte("created_at", `${today}T00:00:00`);

      if ((todayLogs ?? 0) === 0) {
        generated.push({
          id: "no-logs",
          message: "No logs recorded today – monitoring may be incomplete",
          severity: "warning",
          type: "Missing Logs",
        });
      }

      // Check for HACCP plan existence
      const { data: plans } = await supabase
        .from("haccp_plans")
        .select("id")
        .eq("organization_id", orgId)
        .eq("branch_id", branchId)
        .limit(1);

      if (!plans || plans.length === 0) {
        generated.push({
          id: "no-plan",
          message: "No HACCP plan created for this branch",
          severity: "warning",
          type: "Setup Required",
        });
      }

      setAlerts(generated);
    };

    load();
  }, [profile?.organization_id, branchId]);

  if (alerts.length === 0) return null;

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
