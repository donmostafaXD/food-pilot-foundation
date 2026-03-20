/**
 * Hook to load admin-managed plan definitions and module access from the database.
 * Falls back to hardcoded defaults if DB is empty or loading fails.
 */
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface AdminPlanDefinition {
  plan_tier: string;
  display_name: string;
  price: number;
  description: string;
  features: string[];
  highlighted: boolean;
  visible: boolean;
  sort_order: number;
  max_branches: number;
  max_activities: number;
  max_users: number;
}

export interface AdminModuleAccess {
  plan_tier: string;
  module: string;
  access: "full" | "limited" | "locked" | "hidden";
  locked_message: string | null;
  limited_note: string | null;
}

interface AdminPlanConfig {
  plans: AdminPlanDefinition[];
  moduleAccess: AdminModuleAccess[];
  loading: boolean;
  refetch: () => Promise<void>;
}

export function useAdminPlanConfig(): AdminPlanConfig {
  const [plans, setPlans] = useState<AdminPlanDefinition[]>([]);
  const [moduleAccess, setModuleAccess] = useState<AdminModuleAccess[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const [plansRes, accessRes] = await Promise.all([
        supabase
          .from("admin_plan_definitions" as any)
          .select("*")
          .order("sort_order"),
        supabase
          .from("admin_module_access" as any)
          .select("*"),
      ]);

      if (plansRes.data && plansRes.data.length > 0) {
        setPlans(
          (plansRes.data as any[]).map((p) => ({
            plan_tier: p.plan_tier,
            display_name: p.display_name,
            price: Number(p.price) || 0,
            description: p.description || "",
            features: Array.isArray(p.features) ? p.features : [],
            highlighted: p.highlighted ?? false,
            visible: p.visible ?? true,
            sort_order: p.sort_order ?? 0,
            max_branches: p.max_branches ?? 1,
            max_activities: p.max_activities ?? 1,
            max_users: p.max_users ?? 2,
          }))
        );
      }

      if (accessRes.data && accessRes.data.length > 0) {
        setModuleAccess(
          (accessRes.data as any[]).map((a) => ({
            plan_tier: a.plan_tier,
            module: a.module,
            access: a.access as any,
            locked_message: a.locked_message,
            limited_note: a.limited_note,
          }))
        );
      }
    } catch (err) {
      console.error("[AdminPlanConfig] Failed to load:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchConfig();
  }, []);

  return { plans, moduleAccess, loading, refetch: fetchConfig };
}

/** Get module access for a specific plan+module from the loaded config */
export function getAdminModuleAccess(
  moduleAccess: AdminModuleAccess[],
  planTier: string,
  module: string
): AdminModuleAccess | undefined {
  return moduleAccess.find(
    (a) => a.plan_tier === planTier && a.module === module
  );
}
