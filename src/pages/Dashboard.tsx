import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ShieldCheck,
  Building2,
  GitBranch,
  Loader2,
  ClipboardList,
  ClipboardCheck,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";

const Dashboard = () => {
  const { profile, loading: authLoading, user, onboardingError, signOut } = useAuth();
  const { canViewAllBranches } = useRoleAccess();
  const navigate = useNavigate();
  const [orgName, setOrgName] = useState<string>("");
  const [branchName, setBranchName] = useState<string>("");
  const [hasPlan, setHasPlan] = useState<boolean | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [logCount, setLogCount] = useState(0);
  const [branchCount, setBranchCount] = useState(0);

  useEffect(() => {
    if (authLoading || !user) return;

    if (!profile?.organization_id || !profile?.branch_id) {
      setDataLoading(false);
      return;
    }

    const load = async () => {
      setDataLoading(true);

      const orgId = profile.organization_id!;
      const branchId = profile.branch_id!;

      // Owner sees all branches; Manager/Staff see only their assigned branch
      const planQuery = canViewAllBranches
        ? supabase.from("haccp_plans").select("id").eq("organization_id", orgId).limit(1)
        : supabase.from("haccp_plans").select("id").eq("organization_id", orgId).eq("branch_id", branchId).limit(1);

      const logQuery = canViewAllBranches
        ? supabase.from("log_entries").select("id", { count: "exact", head: true }).eq("organization_id", orgId)
        : supabase.from("log_entries").select("id", { count: "exact", head: true }).eq("organization_id", orgId).eq("branch_id", branchId);

      const [orgRes, branchRes, planRes, logRes, branchCountRes] = await Promise.all([
        supabase.from("organizations").select("name").eq("id", orgId).maybeSingle(),
        supabase.from("branches").select("name").eq("id", branchId).maybeSingle(),
        planQuery,
        logQuery,
        canViewAllBranches
          ? supabase.from("branches").select("id", { count: "exact", head: true }).eq("organization_id", orgId)
          : Promise.resolve({ count: 1 }),
      ]);

      setOrgName(orgRes.data?.name ?? "Unknown");
      setBranchName(branchRes.data?.name ?? "Unknown");
      setHasPlan((planRes.data?.length ?? 0) > 0);
      setLogCount(logRes.count ?? 0);
      setBranchCount((branchCountRes as any).count ?? 1);
      setDataLoading(false);
    };

    load();
  }, [authLoading, user, profile, canViewAllBranches]);

  if (authLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (onboardingError) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-full gap-3 p-8">
          <p className="text-sm text-destructive font-medium">Setup failed</p>
          <p className="text-xs text-muted-foreground">{onboardingError}</p>
          <Button variant="outline" size="sm" onClick={() => signOut()}>
            Sign Out
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Food safety management overview
          </p>
        </div>

        {/* Business name, Branch, and stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="shadow-industrial-sm">
            <CardContent className="flex items-center gap-3 pt-5 pb-4">
              <div className="p-2 rounded-lg bg-primary/10">
                <Building2 className="w-5 h-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Business</p>
                {dataLoading ? (
                  <Skeleton className="h-5 w-32 mt-0.5" />
                ) : (
                  <p className="text-sm font-semibold text-foreground truncate">{orgName}</p>
                )}
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-industrial-sm">
            <CardContent className="flex items-center gap-3 pt-5 pb-4">
              <div className="p-2 rounded-lg bg-accent/10">
                <GitBranch className="w-5 h-5 text-accent" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">
                  {canViewAllBranches ? `Branches (${branchCount})` : "Branch"}
                </p>
                {dataLoading ? (
                  <Skeleton className="h-5 w-32 mt-0.5" />
                ) : (
                  <p className="text-sm font-semibold text-foreground truncate">
                    {canViewAllBranches ? `All branches` : branchName}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-industrial-sm">
            <CardContent className="flex items-center gap-3 pt-5 pb-4">
              <div className="p-2 rounded-lg bg-primary/10">
                <ClipboardList className="w-5 h-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Log Entries</p>
                {dataLoading ? (
                  <Skeleton className="h-5 w-16 mt-0.5" />
                ) : (
                  <p className="text-sm font-semibold text-foreground">{logCount}</p>
                )}
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-industrial-sm">
            <CardContent className="flex items-center gap-3 pt-5 pb-4">
              <div className="p-2 rounded-lg bg-primary/10">
                <ShieldCheck className="w-5 h-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">HACCP Plan</p>
                {dataLoading ? (
                  <Skeleton className="h-5 w-16 mt-0.5" />
                ) : (
                  <p className="text-sm font-semibold text-foreground">{hasPlan ? "Active" : "None"}</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {dataLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-36 rounded-lg" />
            ))}
          </div>
        ) : hasPlan === false ? (
          <Card className="shadow-industrial-md">
            <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="p-4 rounded-full bg-muted">
                <ShieldCheck className="w-8 h-8 text-muted-foreground" />
              </div>
              <div className="text-center">
                <h3 className="text-lg font-semibold text-foreground">No HACCP Plan Yet</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                  Go to Settings → HACCP Setup to create your first food safety plan.
                </p>
              </div>
              <Button onClick={() => navigate("/settings")} className="mt-2">
                Go to Settings
              </Button>
            </CardContent>
          </Card>
        ) : (
          /* Quick Actions — focused on daily operations */
          <Card className="shadow-industrial-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <Button variant="outline" onClick={() => navigate("/logs")}>
                <ClipboardList className="w-4 h-4 mr-2" />
                Go to Logs
              </Button>
              <Button variant="outline" onClick={() => navigate("/audit")}>
                <ClipboardCheck className="w-4 h-4 mr-2" />
                Audit Ready
              </Button>
              <Button variant="outline" onClick={() => navigate("/haccp")}>
                <ShieldCheck className="w-4 h-4 mr-2" />
                View HACCP Plan
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
