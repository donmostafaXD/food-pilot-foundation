import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export interface Activity {
  id: string;
  activity_name: string;
  business_type: string;
  branch_id: string;
  status: string;
  created_at: string;
}

interface ActivityContextType {
  activities: Activity[];
  activeActivityId: string | null;
  activeActivity: Activity | null;
  loading: boolean;
  switchActivity: (planId: string) => void;
  refreshActivities: () => Promise<void>;
}

const ActivityContext = createContext<ActivityContextType | undefined>(undefined);

export const useActivity = () => {
  const ctx = useContext(ActivityContext);
  if (!ctx) throw new Error("useActivity must be inside ActivityProvider");
  return ctx;
};

const STORAGE_KEY = "active_activity_id";

export const ActivityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile, loading: authLoading } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activeActivityId, setActiveActivityId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadActivities = useCallback(async () => {
    if (!profile?.organization_id || !profile?.branch_id) {
      setActivities([]);
      setActiveActivityId(null);
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from("haccp_plans")
      .select("id, activity_name, business_type, branch_id, status, created_at")
      .eq("organization_id", profile.organization_id)
      .eq("branch_id", profile.branch_id)
      .order("created_at", { ascending: false });

    const list = (data || []) as Activity[];
    setActivities(list);

    // Restore persisted selection or default to latest
    const stored = localStorage.getItem(STORAGE_KEY);
    const match = list.find((a) => a.id === stored);
    if (match) {
      setActiveActivityId(match.id);
    } else if (list.length > 0) {
      setActiveActivityId(list[0].id);
      localStorage.setItem(STORAGE_KEY, list[0].id);
    } else {
      setActiveActivityId(null);
      localStorage.removeItem(STORAGE_KEY);
    }

    setLoading(false);
  }, [profile?.organization_id, profile?.branch_id]);

  useEffect(() => {
    if (authLoading) return;
    loadActivities();
  }, [authLoading, loadActivities]);

  const switchActivity = useCallback((planId: string) => {
    setActiveActivityId(planId);
    localStorage.setItem(STORAGE_KEY, planId);
  }, []);

  const refreshActivities = useCallback(async () => {
    await loadActivities();
  }, [loadActivities]);

  const activeActivity = activities.find((a) => a.id === activeActivityId) || null;

  return (
    <ActivityContext.Provider
      value={{
        activities,
        activeActivityId,
        activeActivity,
        loading,
        switchActivity,
        refreshActivities,
      }}
    >
      {children}
    </ActivityContext.Provider>
  );
};
