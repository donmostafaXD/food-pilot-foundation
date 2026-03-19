import React, { createContext, useContext, useState, useCallback } from "react";
import type { PlanTier } from "@/hooks/usePlan";

export type PreviewRole = "Owner" | "Manager" | "Staff" | null;

interface AdminPlanOverrideContextType {
  overridePlan: PlanTier | null;
  setOverridePlan: (plan: PlanTier | null) => void;
  overrideRole: PreviewRole;
  setOverrideRole: (role: PreviewRole) => void;
  isOverrideActive: boolean;
  resetOverride: () => void;
}

const AdminPlanOverrideContext = createContext<AdminPlanOverrideContextType | undefined>(undefined);

export const useAdminPlanOverride = () => {
  const ctx = useContext(AdminPlanOverrideContext);
  if (!ctx) return {
    overridePlan: null as PlanTier | null,
    setOverridePlan: () => {},
    overrideRole: null as PreviewRole,
    setOverrideRole: () => {},
    isOverrideActive: false,
    resetOverride: () => {},
  };
  return ctx;
};

export const AdminPlanOverrideProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [overridePlan, setOverridePlanState] = useState<PlanTier | null>(() => {
    try {
      return (localStorage.getItem("admin_selected_plan") as PlanTier) || null;
    } catch { return null; }
  });

  const [overrideRole, setOverrideRoleState] = useState<PreviewRole>(() => {
    try {
      return (localStorage.getItem("admin_selected_role") as PreviewRole) || null;
    } catch { return null; }
  });

  const setOverridePlan = useCallback((plan: PlanTier | null) => {
    setOverridePlanState(plan);
    try {
      if (plan) localStorage.setItem("admin_selected_plan", plan);
      else localStorage.removeItem("admin_selected_plan");
    } catch {}
  }, []);

  const setOverrideRole = useCallback((role: PreviewRole) => {
    setOverrideRoleState(role);
    try {
      if (role) localStorage.setItem("admin_selected_role", role);
      else localStorage.removeItem("admin_selected_role");
    } catch {}
  }, []);

  const resetOverride = useCallback(() => {
    setOverridePlan(null);
    setOverrideRole(null);
  }, [setOverridePlan, setOverrideRole]);

  const isOverrideActive = overridePlan !== null || overrideRole !== null;

  return (
    <AdminPlanOverrideContext.Provider value={{
      overridePlan,
      setOverridePlan,
      overrideRole,
      setOverrideRole,
      isOverrideActive,
      resetOverride,
    }}>
      {children}
    </AdminPlanOverrideContext.Provider>
  );
};
