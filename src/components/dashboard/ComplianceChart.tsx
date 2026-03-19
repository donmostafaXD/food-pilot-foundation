import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { usePlan } from "@/hooks/usePlan";
import { useRoleAccess } from "@/hooks/useRoleAccess";
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
  const [trendData, setTrendData] = useState<TrendPoint[]>([]);
  const [branchData, setBranchData] = useState<{ name: string; logs: number }[]>([]);
  const [loading, setLoading] = useState(true);

  const isStaff = effectiveRole === "Staff";
  const isOwnerLevel = effectiveRole === "Owner" || effectiveRole === "super_admin";

  useEffect(() => {
    // Staff should never see charts
    if (isStaff || !profile?.organization_id || !branchId) {
      setLoading(false);
      return;
    }

    const load = async () => {
      setLoading(true);
      const orgId = profile.organization_id!;

      const days: TrendPoint[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split("T")[0];
        const nextDay = new Date(d);
        nextDay.setDate(nextDay.getDate() + 1);

        const { count: logCount } = await supabase
          .from("log_entries")
          .select("id", { count: "exact", head: true })
          .eq("organization_id", orgId)
          .eq("branch_id", branchId)
          .gte("created_at", `${dateStr}T00:00:00`)
          .lt("created_at", `${nextDay.toISOString().split("T")[0]}T00:00:00`);

        const { count: devCount } = await supabase
          .from("log_entries")
          .select("id", { count: "exact", head: true })
          .eq("organization_id", orgId)
          .eq("branch_id", branchId)
          .eq("status", "Deviation")
          .gte("created_at", `${dateStr}T00:00:00`)
          .lt("created_at", `${nextDay.toISOString().split("T")[0]}T00:00:00`);

        const logs = logCount ?? 0;
        const devs = devCount ?? 0;
        const compliance = logs > 0 ? Math.round(((logs - devs) / logs) * 100) : 100;

        days.push({
          date: d.toLocaleDateString("en", { weekday: "short" }),
          logs,
          compliance,
        });
      }
      setTrendData(days);

      // Branch comparison only for Owner-level on premium
      if (plan === "premium" && isOwnerLevel && branches.length > 1) {
        const bData = await Promise.all(
          branches.map(async (b) => {
            const { count } = await supabase
              .from("log_entries")
              .select("id", { count: "exact", head: true })
              .eq("organization_id", orgId)
              .eq("branch_id", b.id);
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
  }, [profile?.organization_id, branchId, plan, branches, isStaff, isOwnerLevel]);

  // Staff or basic plan: no charts
  if (isStaff || plan === "basic") return null;

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-64 rounded-lg" />
        <Skeleton className="h-64 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">
            {plan === "premium" ? "Audit Readiness Trend" : "Compliance Trend"}
          </CardTitle>
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
          <CardTitle className="text-sm font-semibold">
            {plan === "premium" && branchData.length > 0 ? "Branch Comparison" : "Logs Activity (7 Days)"}
          </CardTitle>
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
