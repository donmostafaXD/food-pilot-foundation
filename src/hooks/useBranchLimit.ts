import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { usePlan } from "@/hooks/usePlan";

/**
 * Hook to check branch creation limits based on the user's subscription plan.
 * Returns current branch count, max allowed, and whether a new branch can be created.
 */
export function useBranchLimit() {
  const { profile } = useAuth();
  const { maxBranches, loading: planLoading } = usePlan();
  const [branchCount, setBranchCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.organization_id || planLoading) return;

    const fetchCount = async () => {
      const { count } = await supabase
        .from("branches")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", profile.organization_id!);

      setBranchCount(count ?? 0);
      setLoading(false);
    };

    fetchCount();
  }, [profile?.organization_id, planLoading]);

  return {
    branchCount,
    maxBranches,
    canCreateBranch: branchCount < maxBranches,
    loading: loading || planLoading,
  };
}
