import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { usePlan } from "@/hooks/usePlan";
import { isModuleLimited } from "@/lib/plan-features";
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
import AlertsSection from "@/components/dashboard/AlertsSection";
import QuickActions from "@/components/dashboard/QuickActions";
import ComplianceChart from "@/components/dashboard/ComplianceChart";
import RecentActivity from "@/components/dashboard/RecentActivity";

interface Branch {
  id: string;
  name: string;
  activity_type: string | null;
}

const Dashboard = () => {
  const { profile, loading: authLoading, user, onboardingError, signOut } = useAuth();
  const { canViewAllBranches, effectiveRole } = useRoleAccess();
  const { plan } = usePlan();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const isStaff = effectiveRole === "Staff";

  // Re-fetch branches when role changes (canViewAllBranches depends on role)
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
        <KPICards branchId={selectedBranchId} />
        <AlertsSection branchId={selectedBranchId} />
        <QuickActions />
        {/* Staff: no charts */}
        {!isStaff && plan !== "basic" && (
          <ComplianceChart branchId={selectedBranchId} branches={branches} />
        )}
        <RecentActivity branchId={selectedBranchId} />
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
