import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { usePlan } from "@/hooks/usePlan";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { useActivity } from "@/contexts/ActivityContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

interface Props {
  branchId: string | null;
  branches: { id: string; name: string }[];
}

interface TrendPoint {
  date: string;
  logs: number;
  compliance: number;
}

const ComplianceChart = ({ branchId, branches }: Props) => {
  const { profile } = useAuth();
  const { plan } = usePlan();
  const { effectiveRole } = useRoleAccess();
  const { activeActivity } = useActivity();
  const [trendData, setTrendData] = useState<TrendPoint[]>([]);
  const [branchData, setBranchData] = useState<{ name: string; logs: number }[]>([]);
  const [loading, setLoading] = useState(true);

  const isStaff = effectiveRole === "Staff";
  const isOwnerLevel = effectiveRole === "Owner" || effectiveRole === "super_admin";
  const activityName = activeActivity?.activity_name ?? null;

  useEffect(() => {
    if (isStaff || !profile?.organization_id || !branchId) {
      setLoading(false);
      return;
    }

    const load = async () => {
      setLoading(true);
      const orgId = profile.organization_id!;

      // Get process steps for activity-scoped queries
      let processSteps: string[] = [];
      if (activityName) {
        const { data: mapping } = await supabase
          .from("activity_process_map")
          .select("process")
          .eq("activity", activityName);
        processSteps = (mapping || []).map((m) => m.process);
      }

      // 7-day trend - batch into a single query for efficiency
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      let trendQuery = supabase
        .from("log_entries")
        .select("created_at, status")
        .eq("organization_id", orgId)
        .eq("branch_id", branchId)
        .gte("created_at", sevenDaysAgo.toISOString())
        .order("created_at");
      if (processSteps.length > 0) trendQuery = trendQuery.in("process_step", processSteps);

      const { data: trendLogs } = await trendQuery;

      // Group by day
      const dayMap = new Map<string, { logs: number; devs: number }>();
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toISOString().split("T")[0];
        dayMap.set(key, { logs: 0, devs: 0 });
      }

      (trendLogs || []).forEach((log: any) => {
        const key = log.created_at.split("T")[0];
        const entry = dayMap.get(key);
        if (entry) {
          entry.logs++;
          if (log.status === "Deviation") entry.devs++;
        }
      });

      const days: TrendPoint[] = [];
      dayMap.forEach((val, key) => {
        const d = new Date(key);
        const compliance = val.logs > 0 ? Math.round(((val.logs - val.devs) / val.logs) * 100) : 100;
        days.push({
          date: d.toLocaleDateString("en", { weekday: "short" }),
          logs: val.logs,
          compliance,
        });
      });
      setTrendData(days);

      // Branch comparison for premium Owner
      if (plan === "premium" && isOwnerLevel && branches.length > 1) {
        const bData = await Promise.all(
          branches.map(async (b) => {
            let q = supabase
              .from("log_entries")
              .select("id", { count: "exact", head: true })
              .eq("organization_id", orgId)
              .eq("branch_id", b.id);
            if (processSteps.length > 0) q = q.in("process_step", processSteps);
            const { count } = await q;
            return { name: b.name, logs: count ?? 0 };
          })
        );
        setBranchData(bData);
      } else {
        setBranchData([]);
      }

      setLoading(false);
    };

    load();
  }, [profile?.organization_id, branchId, plan, branches, isStaff, isOwnerLevel, activityName]);

  if (isStaff || plan === "basic") return null;

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-64 rounded-lg" />
        <Skeleton className="h-64 rounded-lg" />
      </div>
    );
  }

  const leftTitle = plan === "premium" ? "Audit Readiness Trend" : "Compliance Trend";
  const rightTitle = plan === "premium" && branchData.length > 0 ? "Branch Comparison" : "Logs Activity (7 Days)";

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">{leftTitle}</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
              <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} className="fill-muted-foreground" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: 12,
                }}
              />
              <Line type="monotone" dataKey="compliance" stroke="hsl(var(--accent))" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">{rightTitle}</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            {plan === "premium" && branchData.length > 0 ? (
              <BarChart data={branchData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="logs" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            ) : (
              <BarChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="logs" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            )}
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default ComplianceChart;
