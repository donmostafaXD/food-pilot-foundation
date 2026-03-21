import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { usePlan } from "@/hooks/usePlan";
import { useActivity } from "@/contexts/ActivityContext";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import DashboardLayout from "@/components/DashboardLayout";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import KPICards from "@/components/dashboard/KPICards";
import AlertsSection from "@/components/dashboard/AlertsSection";
import QuickActions from "@/components/dashboard/QuickActions";
import ComplianceChart from "@/components/dashboard/ComplianceChart";
import RecentActivity from "@/components/dashboard/RecentActivity";
import { UpgradePrompt } from "@/components/UpgradePrompt";

interface Branch {
  id: string;
  name: string;
  activity_type: string | null;
}

const Dashboard = () => {
  const { profile, loading: authLoading, user, onboardingError, signOut } = useAuth();
  const { canViewAllBranches, effectiveRole } = useRoleAccess();
  const { plan } = usePlan();
  const { activeActivity } = useActivity();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const isStaff = effectiveRole === "Staff";
  const isOwnerLevel = effectiveRole === "Owner" || effectiveRole === "super_admin";
  const isManagerLevel = isOwnerLevel || effectiveRole === "Manager";

  useEffect(() => {
    if (authLoading || !user || !profile?.organization_id) return;

    const load = async () => {
      const orgId = profile.organization_id!;

      if (canViewAllBranches) {
        const { data } = await supabase
          .from("branches")
          .select("id, name, activity_type")
          .eq("organization_id", orgId)
          .order("created_at");
        const list = (data as Branch[]) ?? [];
        setBranches(list);
        setSelectedBranchId(profile.branch_id ?? list[0]?.id ?? null);
      } else {
        if (profile.branch_id) {
          const { data } = await supabase
            .from("branches")
            .select("id, name, activity_type")
            .eq("id", profile.branch_id)
            .maybeSingle();
          const branch = data as Branch | null;
          setBranches(branch ? [branch] : []);
          setSelectedBranchId(branch?.id ?? null);
        }
      }
      setReady(true);
    };

    load();
  }, [authLoading, user, profile, canViewAllBranches]);

  if (authLoading || !ready) {
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
      <div className="p-4 lg:p-6 max-w-7xl mx-auto space-y-5">
        <DashboardHeader
          selectedBranchId={selectedBranchId}
          onBranchChange={setSelectedBranchId}
          branches={branches}
        />

        {/* Plan context for Basic */}
        {plan === "basic" && !isStaff && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/10">
            <Badge variant="secondary" className="text-[10px]">Basic Plan</Badge>
            <p className="text-xs text-muted-foreground">
              You're on the Basic plan with essential food safety tools.
              <a href="/settings" className="text-primary hover:underline ml-1">See upgrade options →</a>
            </p>
          </div>
        )}

        {/* KPIs - all roles, adapted internally */}
        <KPICards branchId={selectedBranchId} branches={branches} />

        {/* Alerts - Manager/Owner see full alerts, Staff sees alerts too */}
        <AlertsSection branchId={selectedBranchId} />

        {/* Quick Actions - role-specific */}
        <QuickActions />

        {/* Charts - Manager/Owner, non-basic; hidden for Staff */}
        {!isStaff && isManagerLevel && plan !== "basic" && (
          <ComplianceChart branchId={selectedBranchId} branches={branches} />
        )}
        {!isStaff && isManagerLevel && plan === "basic" && (
          <UpgradePrompt
            featureName="Compliance Charts"
            requiredPlan="professional"
            description="Upgrade to HACCP plan to unlock compliance trend charts and analytics."
            variant="card"
          />
        )}

        {/* Recent Activity - all roles, adapted internally */}
        <RecentActivity branchId={selectedBranchId} />
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
