import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { usePlan, type PlanTier } from "@/hooks/usePlan";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { useActivity } from "@/contexts/ActivityContext";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ClipboardList,
  AlertTriangle,
  ShieldCheck,
  TrendingUp,
  FileCheck,
  BarChart3,
  GitCompare,
} from "lucide-react";

interface Props {
  branchId: string | null;
  branches: { id: string; name: string }[];
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
  branchComparisonLabel: string;
}

const KPICards = ({ branchId, branches }: Props) => {
  const { profile } = useAuth();
  const { plan } = usePlan();
  const { effectiveRole } = useRoleAccess();
  const { activeActivity } = useActivity();
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
    branchComparisonLabel: "",
  });

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

      // Get process steps for this activity to scope log queries
      let processSteps: string[] = [];
      if (activityName) {
        const { data: mapping } = await supabase
          .from("activity_process_map")
          .select("process")
          .eq("activity", activityName);
        processSteps = (mapping || []).map((m) => m.process);
      }

      // Build scoped log queries
      const buildLogQuery = (extra?: (q: any) => any) => {
        let q = supabase
          .from("log_entries")
          .select("id", { count: "exact", head: true })
          .eq("organization_id", orgId)
          .eq("branch_id", branchId);
        if (processSteps.length > 0) {
          q = q.in("process_step", processSteps);
        }
        return extra ? extra(q) : q;
      };

      const [logsTodayRes, totalLogsRes, deviationsRes, planRes, docRes] = await Promise.all([
        buildLogQuery((q: any) => q.gte("created_at", `${today}T00:00:00`)),
        buildLogQuery(),
        buildLogQuery((q: any) => q.eq("status", "Deviation")),
        supabase
          .from("haccp_plans")
          .select("id")
          .eq("organization_id", orgId)
          .eq("branch_id", branchId)
          .limit(1),
        supabase
          .from("uploaded_documents")
          .select("id", { count: "exact", head: true })
          .eq("organization_id", orgId)
          .eq("branch_id", branchId),
      ]);

      const logsToday = logsTodayRes.count ?? 0;
      const totalLogs = totalLogsRes.count ?? 0;
      const deviations = deviationsRes.count ?? 0;
      const hasPlan = (planRes.data?.length ?? 0) > 0;
      const docCount = docRes.count ?? 0;

      const complianceScore = totalLogs > 0 ? Math.round(((totalLogs - deviations) / totalLogs) * 100) : 100;
      const ccpStatus = deviations > 0 ? "Alert" : "OK";
      const logsCompletionPct = logsToday > 0 ? Math.min(100, Math.round((logsToday / 5) * 100)) : 0;
      const auditReadiness = hasPlan ? Math.min(100, complianceScore + 5) : 0;
      // Docs completion: rough estimate based on expected minimum docs
      const expectedDocs = 10;
      const docCompletionPct = Math.min(100, Math.round((docCount / expectedDocs) * 100));

      // Branch comparison label for premium
      const branchComparisonLabel = branches.length > 1
        ? `${branches.length} branches`
        : "1 branch";

      setData({
        logsToday,
        missingLogs: Math.max(0, 5 - logsToday),
        complianceScore,
        ccpStatus,
        openIssues: deviations,
        logsCompletionPct,
        auditReadiness,
        docCompletionPct,
        branchComparisonLabel,
      });
      setLoading(false);
    };

    load();
  }, [profile?.organization_id, branchId, activityName, branches.length]);

  const isStaff = effectiveRole === "Staff";
  const isOwnerLevel = effectiveRole === "Owner" || effectiveRole === "super_admin";

  // Staff always gets minimal KPIs
  if (isStaff) {
    const staffCards = [
      { label: "Logs Today", value: data.logsToday, icon: ClipboardList, color: "text-primary" },
      { label: "Missing Logs", value: data.missingLogs, icon: AlertTriangle, color: data.missingLogs > 0 ? "text-destructive" : "text-accent" },
    ];

    return (
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
        {staffCards.map((kpi, i) => (
          <KPICard key={i} kpi={kpi} loading={loading} />
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
          { label: "Global Compliance", value: `${data.complianceScore}%`, icon: ShieldCheck, color: "text-accent" },
          { label: "Audit Readiness", value: `${data.auditReadiness}%`, icon: FileCheck, color: "text-primary" },
          { label: "Open Issues", value: data.openIssues, icon: AlertTriangle, color: data.openIssues > 0 ? "text-destructive" : "text-accent" },
          { label: "Docs Complete", value: `${data.docCompletionPct}%`, icon: BarChart3, color: "text-primary" },
          { label: "Branches", value: data.branchComparisonLabel, icon: GitCompare, color: "text-muted-foreground" },
        ]
      : [
          { label: "Compliance", value: `${data.complianceScore}%`, icon: ShieldCheck, color: "text-accent" },
          { label: "CCP Status", value: data.ccpStatus, icon: ShieldCheck, color: data.ccpStatus === "OK" ? "text-accent" : "text-destructive" },
          { label: "Open Issues", value: data.openIssues, icon: AlertTriangle, color: data.openIssues > 0 ? "text-destructive" : "text-accent" },
        ],
  };

  const cards = kpiConfig[plan] || kpiConfig.premium || [];

  return (
    <div className={`grid gap-4 ${cards.length <= 3 ? "grid-cols-1 sm:grid-cols-3" : cards.length === 4 ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-5"}`}>
      {cards.map((kpi, i) => (
        <KPICard key={i} kpi={kpi} loading={loading} />
      ))}
    </div>
  );
};

function KPICard({ kpi, loading }: { kpi: { label: string; value: string | number; icon: React.ElementType; color: string }; loading: boolean }) {
  return (
    <Card className="shadow-sm">
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
  );
}

export default KPICards;
