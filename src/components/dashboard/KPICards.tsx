import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { usePlan, type PlanTier } from "@/hooks/usePlan";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ClipboardList,
  AlertTriangle,
  ShieldCheck,
  TrendingUp,
  FileCheck,
  BarChart3,
} from "lucide-react";

interface Props {
  branchId: string | null;
}

interface KPIData {
  logsToday: number;
  missingLogs: number;
  complianceScore: number;
  ccpStatus: string;
  openIssues: number;
  logsCompletionPct: number;
  auditReadiness: number;
  docCompletionPct: number;
}

const KPICards = ({ branchId }: Props) => {
  const { profile } = useAuth();
  const { plan } = usePlan();
  const { effectiveRole } = useRoleAccess();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<KPIData>({
    logsToday: 0,
    missingLogs: 0,
    complianceScore: 0,
    ccpStatus: "OK",
    openIssues: 0,
    logsCompletionPct: 0,
    auditReadiness: 0,
    docCompletionPct: 0,
  });

  useEffect(() => {
    if (!profile?.organization_id || !branchId) {
      setLoading(false);
      return;
    }

    const load = async () => {
      setLoading(true);
      const orgId = profile.organization_id!;
      const today = new Date().toISOString().split("T")[0];

      const [logsTodayRes, totalLogsRes, deviationsRes, planRes] = await Promise.all([
        supabase
          .from("log_entries")
          .select("id", { count: "exact", head: true })
          .eq("organization_id", orgId)
          .eq("branch_id", branchId)
          .gte("created_at", `${today}T00:00:00`),
        supabase
          .from("log_entries")
          .select("id", { count: "exact", head: true })
          .eq("organization_id", orgId)
          .eq("branch_id", branchId),
        supabase
          .from("log_entries")
          .select("id", { count: "exact", head: true })
          .eq("organization_id", orgId)
          .eq("branch_id", branchId)
          .eq("status", "Deviation"),
        supabase
          .from("haccp_plans")
          .select("id")
          .eq("organization_id", orgId)
          .eq("branch_id", branchId)
          .limit(1),
      ]);

      const logsToday = logsTodayRes.count ?? 0;
      const totalLogs = totalLogsRes.count ?? 0;
      const deviations = deviationsRes.count ?? 0;
      const hasPlan = (planRes.data?.length ?? 0) > 0;

      const complianceScore = totalLogs > 0 ? Math.round(((totalLogs - deviations) / totalLogs) * 100) : 100;
      const ccpStatus = deviations > 0 ? "Alert" : "OK";
      const logsCompletionPct = logsToday > 0 ? Math.min(100, Math.round((logsToday / 5) * 100)) : 0;
      const auditReadiness = hasPlan ? Math.min(100, complianceScore + 5) : 0;
      const docCompletionPct = hasPlan ? 75 : 0;

      setData({
        logsToday,
        missingLogs: Math.max(0, 5 - logsToday),
        complianceScore,
        ccpStatus,
        openIssues: deviations,
        logsCompletionPct,
        auditReadiness,
        docCompletionPct,
      });
      setLoading(false);
    };

    load();
  }, [profile?.organization_id, branchId]);

  const isStaff = effectiveRole === "Staff";
  const isOwnerLevel = effectiveRole === "Owner" || effectiveRole === "super_admin";

  // Staff always gets minimal KPIs regardless of plan
  if (isStaff) {
    const staffCards = [
      { label: "Logs Today", value: data.logsToday, icon: ClipboardList, color: "text-primary" },
      { label: "Missing Logs", value: data.missingLogs, icon: AlertTriangle, color: data.missingLogs > 0 ? "text-destructive" : "text-accent" },
    ];

    return (
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
        {staffCards.map((kpi, i) => (
          <Card key={i} className="shadow-sm">
            <CardContent className="flex items-center gap-3 pt-5 pb-4">
              <div className="p-2.5 rounded-lg bg-muted">
                <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{kpi.label}</p>
                {loading ? (
                  <Skeleton className="h-6 w-16 mt-0.5" />
                ) : (
                  <p className="text-lg font-bold text-foreground">{kpi.value}</p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Manager/Owner KPIs vary by plan
  const kpiConfig: Partial<Record<PlanTier, { label: string; value: string | number; icon: React.ElementType; color: string }[]>> = {
    basic: [
      { label: "Logs Today", value: data.logsToday, icon: ClipboardList, color: "text-primary" },
      { label: "Missing Logs", value: data.missingLogs, icon: AlertTriangle, color: data.missingLogs > 0 ? "text-destructive" : "text-accent" },
      { label: "Compliance", value: `${data.complianceScore}%`, icon: ShieldCheck, color: "text-accent" },
    ],
    professional: [
      { label: "Compliance", value: `${data.complianceScore}%`, icon: ShieldCheck, color: "text-accent" },
      { label: "CCP Status", value: data.ccpStatus, icon: ShieldCheck, color: data.ccpStatus === "OK" ? "text-accent" : "text-destructive" },
      { label: "Open Issues", value: data.openIssues, icon: AlertTriangle, color: data.openIssues > 0 ? "text-destructive" : "text-accent" },
      { label: "Logs Completion", value: `${data.logsCompletionPct}%`, icon: TrendingUp, color: "text-primary" },
    ],
    premium: isOwnerLevel
      ? [
          { label: "Compliance", value: `${data.complianceScore}%`, icon: ShieldCheck, color: "text-accent" },
          { label: "Audit Readiness", value: `${data.auditReadiness}%`, icon: FileCheck, color: "text-primary" },
          { label: "Open Issues", value: data.openIssues, icon: AlertTriangle, color: data.openIssues > 0 ? "text-destructive" : "text-accent" },
          { label: "Docs Complete", value: `${data.docCompletionPct}%`, icon: BarChart3, color: "text-primary" },
        ]
      : [
          { label: "Compliance", value: `${data.complianceScore}%`, icon: ShieldCheck, color: "text-accent" },
          { label: "CCP Status", value: data.ccpStatus, icon: ShieldCheck, color: data.ccpStatus === "OK" ? "text-accent" : "text-destructive" },
          { label: "Open Issues", value: data.openIssues, icon: AlertTriangle, color: data.openIssues > 0 ? "text-destructive" : "text-accent" },
        ],
  };

  const cards = kpiConfig[plan];

  return (
    <div className={`grid gap-4 ${cards.length === 3 ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"}`}>
      {cards.map((kpi, i) => (
        <Card key={i} className="shadow-sm">
          <CardContent className="flex items-center gap-3 pt-5 pb-4">
            <div className="p-2.5 rounded-lg bg-muted">
              <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">{kpi.label}</p>
              {loading ? (
                <Skeleton className="h-6 w-16 mt-0.5" />
              ) : (
                <p className="text-lg font-bold text-foreground">{kpi.value}</p>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default KPICards;
