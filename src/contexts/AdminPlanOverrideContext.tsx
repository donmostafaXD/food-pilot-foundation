import React, { createContext, useContext, useState, useCallback } from "react";
import type { PlanTier } from "@/hooks/usePlan";

interface AdminPlanOverrideContextType {
  overridePlan: PlanTier | null;
  setOverridePlan: (plan: PlanTier | null) => void;
  isOverrideActive: boolean;
  resetOverride: () => void;
}

const AdminPlanOverrideContext = createContext<AdminPlanOverrideContextType | undefined>(undefined);

export const useAdminPlanOverride = () => {
  const ctx = useContext(AdminPlanOverrideContext);
  if (!ctx) return { overridePlan: null, setOverridePlan: () => {}, isOverrideActive: false, resetOverride: () => {} };
  return ctx;
};

export const AdminPlanOverrideProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [overridePlan, setOverridePlanState] = useState<PlanTier | null>(() => {
    try {
      return (localStorage.getItem("admin_selected_plan") as PlanTier) || null;
    } catch { return null; }
  });

  const setOverridePlan = useCallback((plan: PlanTier | null) => {
    setOverridePlanState(plan);
    try {
      if (plan) localStorage.setItem("admin_selected_plan", plan);
      else localStorage.removeItem("admin_selected_plan");
    } catch {}
  }, []);

  const resetOverride = useCallback(() => setOverridePlan(null), [setOverridePlan]);

  return (
    <AdminPlanOverrideContext.Provider value={{ overridePlan, setOverridePlan, isOverrideActive: overridePlan !== null, resetOverride }}>
      {children}
    </AdminPlanOverrideContext.Provider>
  );
};
