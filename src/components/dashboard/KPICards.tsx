import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { usePlan, type PlanTier } from "@/hooks/usePlan";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { useActivity } from "@/contexts/ActivityContext";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  ClipboardList,
  AlertTriangle,
  ShieldCheck,
  TrendingUp,
  FileCheck,
  BarChart3,
  GitCompare,
  Inbox,
} from "lucide-react";

interface Props {
  branchId: string | null;
  branches: { id: string; name: string }[];
}

interface KPIData {
  logsToday: number;
  requiredLogsToday: number;
  totalLogs: number;
  deviations: number;
  ccpCritical: boolean;
  hasPlan: boolean;
  docCount: number;
  branchCount: number;
  // Structured compliance sub-scores
  ccpScore: number;
  prpScore: number;
  logsScore: number;
}

const KPICards = ({ branchId, branches }: Props) => {
  const { profile } = useAuth();
  const { plan } = usePlan();
  const { effectiveRole } = useRoleAccess();
  const { activeActivity } = useActivity();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<KPIData>({
    logsToday: 0,
    requiredLogsToday: 0,
    totalLogs: 0,
    deviations: 0,
    ccpCritical: false,
    hasPlan: false,
    docCount: 0,
    branchCount: 0,
    ccpScore: 0,
    prpScore: 0,
    logsScore: 0,
  });
  const [noData, setNoData] = useState(false);

  const activityName = activeActivity?.activity_name ?? null;

  useEffect(() => {
    if (!profile?.organization_id || !branchId) {
      setLoading(false);
      setNoData(true);
      return;
    }

    const load = async () => {
      setLoading(true);
      const orgId = profile.organization_id!;
      const today = new Date().toISOString().split("T")[0];

      // Get process steps for this activity
      let processSteps: string[] = [];
      if (activityName) {
        const { data: mapping } = await supabase
          .from("activity_process_map")
          .select("process")
          .eq("activity", activityName);
        processSteps = (mapping || []).map((m) => m.process);
      }

      // Count required logs for this activity
      let requiredLogsToday = 5;
      if (activityName) {
        const { count } = await supabase
          .from("logs_mapping")
          .select("id", { count: "exact", head: true })
          .eq("activity", activityName);
        requiredLogsToday = count ?? 5;
      }

      // Build scoped log queries
      const buildLogQuery = (extra?: (q: any) => any) => {
        let q = supabase
          .from("log_entries")
          .select("id", { count: "exact", head: true })
          .eq("organization_id", orgId)
          .eq("branch_id", branchId);
        if (processSteps.length > 0) q = q.in("process_step", processSteps);
        return extra ? extra(q) : q;
      };

      // --- CCP Score calculation ---
      const calcCcpScore = async (): Promise<{ score: number; critical: boolean }> => {
        if (!activityName) return { score: 100, critical: false };
        const { data: plans } = await supabase
          .from("haccp_plans")
          .select("id")
          .eq("organization_id", orgId)
          .eq("branch_id", branchId)
          .eq("activity_name", activityName)
          .limit(1);
        if (!plans || plans.length === 0) return { score: 0, critical: false };

        const { data: steps } = await supabase
          .from("haccp_plan_steps")
          .select("id")
          .eq("haccp_plan_id", plans[0].id);
        if (!steps || steps.length === 0) return { score: 0, critical: false };

        const stepIds = steps.map((s) => s.id);
        const { data: hazards } = await supabase
          .from("haccp_plan_hazards")
          .select("control_type")
          .in("haccp_plan_step_id", stepIds)
          .eq("control_type", "CCP");

        const totalCCP = hazards?.length ?? 0;
        if (totalCCP === 0) return { score: 100, critical: false };

        // Deviations count as failed CCPs
        const { count: devCount } = await buildLogQuery((q: any) => q.eq("status", "Deviation"));
        const ccpFailed = Math.min(devCount ?? 0, totalCCP);
        const passed = totalCCP - ccpFailed;
        return {
          score: Math.round((passed / totalCCP) * 100),
          critical: ccpFailed > 0,
        };
      };

      // --- PRP Score calculation ---
      const calcPrpScore = async (): Promise<number> => {
        if (!activityName) return 0;
        // Total required PRP programs for this activity
        const { count: totalPrp } = await supabase
          .from("prp_mapping")
          .select("id", { count: "exact", head: true })
          .eq("activity", activityName);
        if (!totalPrp || totalPrp === 0) return 100; // no programs required = fully compliant

        // Completed PRP records for this branch (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const { count: completedPrp } = await supabase
          .from("prp_records")
          .select("id", { count: "exact", head: true })
          .eq("organization_id", orgId)
          .eq("branch_id", branchId)
          .eq("status", "Completed")
          .gte("date", thirtyDaysAgo.toISOString().split("T")[0]);

        return Math.min(100, Math.round(((completedPrp ?? 0) / totalPrp) * 100));
      };

      const [
        logsTodayRes,
        totalLogsRes,
        deviationsRes,
        planRes,
        docRes,
        ccpResult,
        prpScore,
      ] = await Promise.all([
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
        calcCcpScore(),
        calcPrpScore(),
      ]);

      const logsToday = logsTodayRes.count ?? 0;
      const totalLogs = totalLogsRes.count ?? 0;
      const deviations = deviationsRes.count ?? 0;
      const hasPlan = (planRes.data?.length ?? 0) > 0;
      const docCount = docRes.count ?? 0;

      // Logs Score = (Logs filled today / Required logs today) * 100
      const logsScore = requiredLogsToday > 0
        ? Math.min(100, Math.round((logsToday / requiredLogsToday) * 100))
        : 0;

      setNoData(totalLogs === 0 && logsToday === 0);
      setData({
        logsToday,
        requiredLogsToday,
        totalLogs,
        deviations,
        ccpCritical: ccpResult.critical,
        hasPlan,
        docCount,
        branchCount: branches.length,
        ccpScore: ccpResult.score,
        prpScore,
        logsScore,
      });
      setLoading(false);
    };

    load();
  }, [profile?.organization_id, branchId, activityName, branches.length]);

  // --- Derived metrics ---
  // Simple compliance (kept for Basic plan)
  const simpleCompliance =
    data.totalLogs > 0
      ? Math.round(((data.totalLogs - data.deviations) / data.totalLogs) * 100)
      : 0;

  // Weighted compliance for HACCP/Compliance plans
  const weightedCompliance = Math.round(
    data.ccpScore * 0.5 + data.prpScore * 0.3 + data.logsScore * 0.2
  );

  const logsCompletionPct = data.logsScore;
  const auditReadiness = data.hasPlan ? Math.min(100, weightedCompliance + 5) : 0;
  const expectedDocs = 10;
  const docCompletionPct = Math.min(100, Math.round((data.docCount / expectedDocs) * 100));
  const ccpStatus = data.ccpCritical ? "Critical" : "OK";
  const missingLogs = Math.max(0, data.requiredLogsToday - data.logsToday);

  const isStaff = effectiveRole === "Staff";
  const isOwnerLevel = effectiveRole === "Owner" || effectiveRole === "super_admin";
  const showBreakdown = plan === "professional" || plan === "premium";

  // Staff: minimal KPIs
  if (isStaff) {
    const staffCards = [
      { label: "Logs Today", value: data.logsToday, icon: ClipboardList, color: "text-primary" },
      {
        label: "Missing Logs",
        value: missingLogs,
        icon: AlertTriangle,
        color: missingLogs > 0 ? "text-destructive" : "text-accent",
      },
    ];
    return (
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
        {staffCards.map((kpi, i) => (
          <KPICard key={i} kpi={kpi} loading={loading} />
        ))}
      </div>
    );
  }

  // Empty state
  if (!loading && noData) {
    return (
      <Card className="shadow-sm">
        <CardContent className="flex flex-col items-center justify-center py-10 text-center">
          <div className="p-3 rounded-full bg-muted mb-3">
            <Inbox className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground">No logs recorded for this activity</p>
          <p className="text-xs text-muted-foreground mt-1">
            Start recording logs to see compliance metrics here.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Use simple score for Basic, weighted for others
  const displayCompliance = showBreakdown ? weightedCompliance : simpleCompliance;

  // KPI cards by plan
  const kpiConfig: Partial<
    Record<PlanTier, { label: string; value: string | number; icon: React.ElementType; color: string }[]>
  > = {
    basic: [
      { label: "Logs Today", value: data.logsToday, icon: ClipboardList, color: "text-primary" },
      { label: "Missing Logs", value: missingLogs, icon: AlertTriangle, color: missingLogs > 0 ? "text-destructive" : "text-accent" },
      { label: "Compliance", value: `${simpleCompliance}%`, icon: ShieldCheck, color: "text-accent" },
    ],
    professional: [
      { label: "Compliance", value: `${displayCompliance}%`, icon: ShieldCheck, color: "text-accent" },
      { label: "CCP Status", value: ccpStatus, icon: ShieldCheck, color: ccpStatus === "OK" ? "text-accent" : "text-destructive" },
      { label: "Open Issues", value: data.deviations, icon: AlertTriangle, color: data.deviations > 0 ? "text-destructive" : "text-accent" },
      { label: "Logs Completion", value: `${logsCompletionPct}%`, icon: TrendingUp, color: "text-primary" },
    ],
    premium: isOwnerLevel
      ? [
          { label: "Global Compliance", value: `${displayCompliance}%`, icon: ShieldCheck, color: "text-accent" },
          { label: "Audit Readiness", value: `${auditReadiness}%`, icon: FileCheck, color: "text-primary" },
          { label: "Open Issues", value: data.deviations, icon: AlertTriangle, color: data.deviations > 0 ? "text-destructive" : "text-accent" },
          { label: "Docs Complete", value: `${docCompletionPct}%`, icon: BarChart3, color: "text-primary" },
          { label: "Branches", value: `${data.branchCount} branch${data.branchCount !== 1 ? "es" : ""}`, icon: GitCompare, color: "text-muted-foreground" },
        ]
      : [
          { label: "Compliance", value: `${displayCompliance}%`, icon: ShieldCheck, color: "text-accent" },
          { label: "CCP Status", value: ccpStatus, icon: ShieldCheck, color: ccpStatus === "OK" ? "text-accent" : "text-destructive" },
          { label: "Open Issues", value: data.deviations, icon: AlertTriangle, color: data.deviations > 0 ? "text-destructive" : "text-accent" },
        ],
  };

  const cards = kpiConfig[plan] || kpiConfig.premium || [];

  return (
    <div className="space-y-4">
      <div
        className={`grid gap-4 ${
          cards.length <= 3
            ? "grid-cols-1 sm:grid-cols-3"
            : cards.length === 4
            ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
            : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-5"
        }`}
      >
        {cards.map((kpi, i) => (
          <KPICard key={i} kpi={kpi} loading={loading} />
        ))}
      </div>

      {/* Compliance breakdown for HACCP / Compliance plans */}
      {showBreakdown && !loading && !noData && (
        <ComplianceBreakdown
          ccpScore={data.ccpScore}
          prpScore={data.prpScore}
          logsScore={data.logsScore}
        />
      )}
    </div>
  );
};

function ComplianceBreakdown({
  ccpScore,
  prpScore,
  logsScore,
}: {
  ccpScore: number;
  prpScore: number;
  logsScore: number;
}) {
  const items = [
    { label: "CCP Compliance", score: ccpScore, weight: "50%" },
    { label: "PRP Compliance", score: prpScore, weight: "30%" },
    { label: "Logs Compliance", score: logsScore, weight: "20%" },
  ];

  return (
    <Card className="shadow-sm">
      <CardContent className="pt-4 pb-3">
        <p className="text-xs font-semibold text-muted-foreground mb-3">Compliance Breakdown</p>
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
          {items.map((item) => (
            <div key={item.label} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-foreground font-medium">{item.label}</span>
                <span className="text-xs font-bold text-foreground">{item.score}%</span>
              </div>
              <Progress value={item.score} className="h-1.5" />
              <span className="text-[10px] text-muted-foreground">Weight: {item.weight}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function KPICard({
  kpi,
  loading,
}: {
  kpi: { label: string; value: string | number; icon: React.ElementType; color: string };
  loading: boolean;
}) {
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
