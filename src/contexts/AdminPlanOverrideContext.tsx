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
  const [overridePlan, setOverridePlan] = useState<PlanTier | null>(null);

  const resetOverride = useCallback(() => setOverridePlan(null), []);

  return (
    <AdminPlanOverrideContext.Provider value={{ overridePlan, setOverridePlan, isOverrideActive: overridePlan !== null, resetOverride }}>
      {children}
    </AdminPlanOverrideContext.Provider>
  );
};
