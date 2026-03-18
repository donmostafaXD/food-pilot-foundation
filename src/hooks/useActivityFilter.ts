import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface ActivityFilterResult {
  activityName: string | null;
  activityProcesses: string[];
  /** Process names from the user's actual HACCP plan steps */
  planProcessNames: string[];
  businessType: string;
  planId: string | null;
  /** True when a plan was recently saved/updated (auto-clears after read) */
  planJustUpdated: boolean;
  loading: boolean;
}

/**
 * Hook that resolves the user's current activity (from their latest HACCP plan)
 * and fetches the related processes from activity_process_map + haccp_plan_steps.
 */
export const useActivityFilter = (): ActivityFilterResult => {
  const { profile, loading: authLoading } = useAuth();
  const [activityName, setActivityName] = useState<string | null>(null);
  const [activityProcesses, setActivityProcesses] = useState<string[]>([]);
  const [planProcessNames, setPlanProcessNames] = useState<string[]>([]);
  const [businessType, setBusinessType] = useState("Food Service");
  const [planId, setPlanId] = useState<string | null>(null);
  const [planJustUpdated, setPlanJustUpdated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !profile?.organization_id) return;

    const load = async () => {
      setLoading(true);

      // Get activity from latest HACCP plan
      const { data: plans } = await supabase
        .from("haccp_plans")
        .select("id, activity_name, business_type")
        .eq("organization_id", profile.organization_id!)
        .eq("branch_id", profile.branch_id!)
        .order("created_at", { ascending: false })
        .limit(1);

      const plan = plans?.[0];
      const activity = plan?.activity_name || null;
      const bType = plan?.business_type || "Food Service";

      setActivityName(activity);
      setBusinessType(bType);
      setPlanId(plan?.id || null);

      // Check if plan was just updated (flag set by SetupWizard)
      const updatedFlag = localStorage.getItem("haccp_plan_updated");
      if (updatedFlag) {
        setPlanJustUpdated(true);
        localStorage.removeItem("haccp_plan_updated");
      } else {
        setPlanJustUpdated(false);
      }

      if (activity && plan) {
        // Get processes linked to this activity (from template map)
        const { data: processMap } = await supabase
          .from("activity_process_map")
          .select("process")
          .eq("activity", activity)
          .order("process_order");

        setActivityProcesses((processMap || []).map((p) => p.process));

        // Get actual plan step process names for precise filtering
        const { data: planSteps } = await supabase
          .from("haccp_plan_steps")
          .select("process_name")
          .eq("haccp_plan_id", plan.id)
          .order("step_order");

        setPlanProcessNames((planSteps || []).map((s) => s.process_name));
      } else {
        setActivityProcesses([]);
        setPlanProcessNames([]);
      }

      setLoading(false);
    };

    load();
  }, [authLoading, profile?.organization_id, profile?.branch_id]);

  return { activityName, activityProcesses, planProcessNames, businessType, planId, planJustUpdated, loading };
};
