import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useActivity } from "@/contexts/ActivityContext";
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
 * Hook that resolves the user's current activity (from the selected HACCP plan
 * in ActivityContext) and fetches the related processes from activity_process_map
 * + haccp_plan_steps.
 */
export const useActivityFilter = (): ActivityFilterResult => {
  const { profile, loading: authLoading } = useAuth();
  const { activeActivityId, activeActivity, loading: activityCtxLoading } = useActivity();
  const [activityName, setActivityName] = useState<string | null>(null);
  const [activityProcesses, setActivityProcesses] = useState<string[]>([]);
  const [planProcessNames, setPlanProcessNames] = useState<string[]>([]);
  const [businessType, setBusinessType] = useState("Food Service");
  const [planId, setPlanId] = useState<string | null>(null);
  const [planJustUpdated, setPlanJustUpdated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || activityCtxLoading || !profile?.organization_id) return;

    const load = async () => {
      setLoading(true);

      // Use selected activity from context instead of querying latest
      const activity = activeActivity?.activity_name || null;
      const bType = activeActivity?.business_type || "Food Service";
      const currentPlanId = activeActivityId || null;

      setActivityName(activity);
      setBusinessType(bType);
      setPlanId(currentPlanId);

      // Check if plan was just updated (flag set by SetupWizard)
      const updatedFlag = localStorage.getItem("haccp_plan_updated");
      if (updatedFlag) {
        setPlanJustUpdated(true);
        localStorage.removeItem("haccp_plan_updated");
      } else {
        setPlanJustUpdated(false);
      }

      if (activity && currentPlanId) {
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
          .eq("haccp_plan_id", currentPlanId)
          .order("step_order");

        setPlanProcessNames((planSteps || []).map((s) => s.process_name));
      } else {
        setActivityProcesses([]);
        setPlanProcessNames([]);
      }

      setLoading(false);
    };

    load();
  }, [authLoading, activityCtxLoading, profile?.organization_id, profile?.branch_id, activeActivityId, activeActivity]);

  return { activityName, activityProcesses, planProcessNames, businessType, planId, planJustUpdated, loading };
};
