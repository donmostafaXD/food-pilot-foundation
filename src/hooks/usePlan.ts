import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export type PlanTier = "basic" | "professional" | "premium";

interface PlanFeatures {
  plan: PlanTier;
  loading: boolean;
  canAccessManufacturing: boolean;
  canAccessMultiBranch: boolean;
  canAccessAdvancedAnalytics: boolean;
  canAccessFullHazardLibrary: boolean;
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
    description: "Perfect for small food service businesses",
    features: [
      "Food Service activities",
      "Setup Wizard & HACCP Plan",
      "Basic hazard analysis",
      "Document generation",
      "1 branch",
    ],
  },
  professional: {
    name: "Professional",
    price: 79,
    description: "Full HACCP system for growing businesses",
    features: [
      "Food Service + Manufacturing",
      "Full HACCP system",
      "Complete hazard library",
      "SOP & log management",
      "1 branch",
      "Priority support",
    ],
  },
  premium: {
    name: "Premium",
    price: 149,
    description: "Enterprise-grade food safety management",
    features: [
      "Everything in Professional",
      "Multi-branch support",
      "Advanced analytics",
      "Audit-ready reports",
      "Unlimited branches",
      "Dedicated support",
    ],
  },
};

export function usePlan(): PlanFeatures {
  const { profile, roles } = useAuth();
  const [plan, setPlan] = useState<PlanTier>("basic");
  const [loading, setLoading] = useState(true);

  const isSuperAdmin = roles.includes("super_admin" as any);

  useEffect(() => {
    if (!profile?.organization_id) {
      setLoading(false);
      return;
    }

    const fetch = async () => {
      const { data } = await supabase
        .from("organizations")
        .select("subscription_plan")
        .eq("id", profile.organization_id!)
        .maybeSingle();

      setPlan((data?.subscription_plan as PlanTier) || "basic");
      setLoading(false);
    };

    fetch();
  }, [profile?.organization_id]);

  const updatePlan = async (newPlan: PlanTier) => {
    if (!profile?.organization_id) {
      return { error: new Error("No organization found") };
    }

    const { error } = await supabase
      .from("organizations")
      .update({ subscription_plan: newPlan })
      .eq("id", profile.organization_id);

    if (!error) setPlan(newPlan);
    return { error: error as Error | null };
  };

  return {
    plan,
    loading,
    canAccessManufacturing: isSuperAdmin || plan === "professional" || plan === "premium",
    canAccessMultiBranch: isSuperAdmin || plan === "premium",
    canAccessAdvancedAnalytics: isSuperAdmin || plan === "premium",
    canAccessFullHazardLibrary: isSuperAdmin || plan === "professional" || plan === "premium",
    updatePlan,
  };
}
