import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useAdminPlanOverride } from "@/contexts/AdminPlanOverrideContext";

export type PlanTier = "basic" | "professional" | "premium";

/** Display names mapping internal tier → user-facing name */
export const PLAN_DISPLAY_NAMES: Record<PlanTier, string> = {
  basic: "Basic",
  professional: "HACCP",
  premium: "Compliance",
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
  updatePlan: (newPlan: PlanTier) => Promise<{ error: Error | null }>;
}

export const PLAN_CONFIG: Record<PlanTier, {
  name: string;
  price: number;
  description: string;
  features: string[];
}> = {
  basic: {
    name: "Basic",
    price: 29,
    description: "Simple food safety for small businesses",
    features: [
      "Food Service activities",
      "Simplified HACCP view",
      "CCP / OPRP / PRP labels",
      "Critical limits & monitoring",
      "Document generation",
      "1 branch",
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
      "1 branch",
      "Priority support",
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

export function usePlan(): PlanFeatures {
  const { profile, roles } = useAuth();
  const [dbPlan, setDbPlan] = useState<PlanTier>("basic");
  const [loading, setLoading] = useState(true);

  const { overridePlan } = useAdminPlanOverride();

  const isSuperAdmin = roles.includes("super_admin" as any);

  // Use override if active, otherwise use DB plan
  const plan = overridePlan ?? dbPlan;

  useEffect(() => {
    if (!profile?.organization_id) {
      setLoading(false);
      return;
    }

    const fetchPlan = async () => {
      const { data } = await supabase
        .from("organizations")
        .select("subscription_plan")
        .eq("id", profile.organization_id!)
        .maybeSingle();

      setDbPlan((data?.subscription_plan as PlanTier) || "basic");
      setLoading(false);
    };

    fetchPlan();
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

  // When override is active, DON'T let super_admin bypass — simulate the real plan experience
  const effectiveAdmin = overridePlan ? false : isSuperAdmin;
  const isProPlus = effectiveAdmin || plan === "professional" || plan === "premium";

  return {
    plan,
    planDisplayName: PLAN_DISPLAY_NAMES[plan],
    loading,
    // Feature gates
    canAccessManufacturing: isProPlus,
    canAccessMultiBranch: isSuperAdmin || plan === "premium",
    canAccessAdvancedAnalytics: isSuperAdmin || plan === "premium",
    canAccessFullHazardLibrary: isProPlus,
    // UI visibility
    showRiskFields: isProPlus,
    showComplianceTools: isSuperAdmin || plan === "premium",
    // Module access
    canAccessSOP: isProPlus,
    canAccessPRP: isProPlus,
    canAccessDocuments: isSuperAdmin || plan === "premium",
    canAccessEquipment: isProPlus,
    // Editing
    canEditRiskFields: isProPlus,
    // Export
    canExportFullHACCP: isProPlus,
    updatePlan,
  };
}
