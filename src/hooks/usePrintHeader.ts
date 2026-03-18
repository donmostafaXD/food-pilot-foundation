import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import type { PrintHeader } from "@/lib/printUtils";

/** Returns a PrintHeader populated with the current user's org & branch names. */
export function usePrintHeader(documentTitle: string): PrintHeader & { loading: boolean } {
  const { profile } = useAuth();
  const [orgName, setOrgName] = useState("Organization");
  const [branchName, setBranchName] = useState("Branch");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.organization_id) { setLoading(false); return; }

    const load = async () => {
      const [{ data: org }, { data: branch }] = await Promise.all([
        supabase.from("organizations").select("name").eq("id", profile.organization_id!).maybeSingle(),
        profile.branch_id
          ? supabase.from("branches").select("name").eq("id", profile.branch_id).maybeSingle()
          : Promise.resolve({ data: null }),
      ]);
      if (org?.name) setOrgName(org.name);
      if (branch?.name) setBranchName(branch.name);
      setLoading(false);
    };
    load();
  }, [profile?.organization_id, profile?.branch_id]);

  return { organizationName: orgName, branchName, documentTitle, loading };
}
