import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useAdminPlanOverride } from "@/contexts/AdminPlanOverrideContext";
import { useAdminPlanConfig, type AdminPlanDefinition } from "@/hooks/useAdminPlanConfig";

export type PlanTier = "basic" | "professional" | "premium" | "demo";

/** Display names mapping internal tier → user-facing name */
export const PLAN_DISPLAY_NAMES: Record<PlanTier, string> = {
  basic: "Basic",
  professional: "HACCP",
  premium: "Compliance",
  demo: "Demo",
};

interface PlanFeatures {
  plan: PlanTier;
  planDisplayName: string;
  loading: boolean;
  // Feature gates
  canAccessManufacturing: boolean;
  canAccessMultiBranch: boolean;
  canAccessAdvancedAnalytics: boolean;
  canAccessFullHazardLibrary: boolean;
  // UI visibility
  showRiskFields: boolean;        // S, L, Risk Score columns
  showComplianceTools: boolean;   // Audit, verification, compliance tracking
  // Module access
  canAccessSOP: boolean;
  canAccessPRP: boolean;
  canAccessDocuments: boolean;
  canAccessEquipment: boolean;
  // Editing
  canEditRiskFields: boolean;     // Can edit S & L in HACCP table
  // Export
  canExportFullHACCP: boolean;    // Full hazard analysis & CCP table export
  // Branch & activity limits
  maxBranches: number;            // 1 = Basic, 3 = HACCP, Infinity = Compliance
  maxActivities: number;          // 1 = Basic, Infinity = HACCP+
  updatePlan: (newPlan: PlanTier) => Promise<{ error: Error | null }>;
}

export const PLAN_CONFIG: Partial<Record<PlanTier, {
  name: string;
  price: number;
  description: string;
  features: string[];
}>> = {
  basic: {
    name: "Basic",
    price: 29,
    description: "Simple food safety for small businesses",
    features: [
      "Food Service activities",
      "Simplified HACCP view",
      "CCP / OPRP / PRP labels",
      "Critical limits & monitoring",
      "1 branch only",
      "1 activity only",
    ],
  },
  professional: {
    name: "HACCP",
    price: 79,
    description: "Full HACCP system with risk analysis",
    features: [
      "Food Service + Manufacturing",
      "Full risk analysis (S × L)",
      "Editable severity & likelihood",
      "Complete hazard library",
      "SOP & log management",
      "Up to 3 branches",
      "Multiple activities",
    ],
  },
  premium: {
    name: "Compliance",
    price: 149,
    description: "Enterprise-grade food safety & compliance",
    features: [
      "Everything in HACCP",
      "Audit tools & verification",
      "Compliance tracking",
      "Full document management",
      "Multi-branch support",
      "Advanced analytics",
      "Unlimited branches",
      "Dedicated support",
    ],
  },
};

const isPlanTier = (value: string | null | undefined): value is PlanTier => {
  return value === "basic" || value === "professional" || value === "premium" || value === "demo";
};

export function usePlan(): PlanFeatures {
  const { profile, roles } = useAuth();
  const { plans: adminPlans, loading: adminLoading } = useAdminPlanConfig();
  const [dbPlan, setDbPlan] = useState<PlanTier>("basic");
  const [loading, setLoading] = useState(true);
  const { overridePlan } = useAdminPlanOverride();

  const isSuperAdmin = roles.includes("super_admin" as any);

  useEffect(() => {
    let cancelled = false;

    const fetchPlan = async () => {
      if (!profile?.organization_id) {
        if (!cancelled) {
          setDbPlan("basic");
          setLoading(false);
        }
        return;
      }

      if (!cancelled) setLoading(true);

      const { data, error } = await supabase
        .from("organizations")
        .select("subscription_plan")
        .eq("id", profile.organization_id)
        .maybeSingle();

      if (cancelled) return;

      if (error) {
        console.error("[Plan] Failed to load organization plan:", error);
        setDbPlan("basic");
        setLoading(false);
        return;
      }

      const rawPlan = data?.subscription_plan;
      setDbPlan(isPlanTier(rawPlan) ? rawPlan : "basic");
      setLoading(false);
    };

    void fetchPlan();

    return () => {
      cancelled = true;
    };
  }, [profile?.organization_id]);

  const updatePlan = async (newPlan: PlanTier) => {
    if (!profile?.organization_id) {
      return { error: new Error("No organization found") };
    }

    const { error } = await supabase
      .from("organizations")
      .update({ subscription_plan: newPlan })
      .eq("id", profile.organization_id);

    if (!error) setDbPlan(newPlan);
    return { error: error as Error | null };
  };

  // Single source of truth for current plan: admin override first, then organization plan.
  const resolvedPlan = overridePlan ?? dbPlan;
  const isDemo = resolvedPlan === "demo";

  // When override is active, DON'T let super_admin bypass — simulate a real user plan.
  const effectiveAdmin = overridePlan ? false : isSuperAdmin;
  const isProPlus = effectiveAdmin || isDemo || resolvedPlan === "professional" || resolvedPlan === "premium";
  const resolvedLoading = overridePlan ? false : (loading || adminLoading);

  // Use admin-defined limits when available, otherwise fall back to defaults
  const adminDef = adminPlans.find((p) => p.plan_tier === resolvedPlan);
  const INFINITY_THRESHOLD = 900; // DB stores 999 for unlimited

  const maxBranches = effectiveAdmin
    ? Infinity
    : adminDef
      ? (adminDef.max_branches >= INFINITY_THRESHOLD ? Infinity : adminDef.max_branches)
      : resolvedPlan === "premium" ? Infinity : resolvedPlan === "professional" ? 3 : 1;

  const maxActivities = effectiveAdmin
    ? Infinity
    : adminDef
      ? (adminDef.max_activities >= INFINITY_THRESHOLD ? Infinity : adminDef.max_activities)
      : resolvedPlan === "premium" ? Infinity : resolvedPlan === "professional" ? 3 : 1;

  return {
    plan: resolvedPlan,
    planDisplayName: adminDef?.display_name || PLAN_DISPLAY_NAMES[resolvedPlan],
    loading: resolvedLoading,
    // Feature gates
    canAccessManufacturing: isProPlus,
    canAccessMultiBranch: effectiveAdmin || isDemo || resolvedPlan === "professional" || resolvedPlan === "premium",
    canAccessAdvancedAnalytics: effectiveAdmin || isDemo || resolvedPlan === "premium",
    canAccessFullHazardLibrary: isProPlus,
    // UI visibility
    showRiskFields: isProPlus,
    showComplianceTools: effectiveAdmin || isDemo || resolvedPlan === "premium",
    // Module access
    canAccessSOP: isProPlus,
    canAccessPRP: isProPlus,
    canAccessDocuments: effectiveAdmin || isDemo || resolvedPlan === "premium",
    canAccessEquipment: isProPlus,
    // Editing
    canEditRiskFields: isProPlus,
    // Export
    canExportFullHACCP: isProPlus,
    // Branch & activity limits
    maxBranches,
    maxActivities,
    updatePlan,
  };
}
