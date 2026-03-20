/**
 * Hook to load admin UI config (upgrade messages, sidebar toggles, etc.)
 */
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface AdminUIConfig {
  configs: Record<string, Record<string, any>>;
  loading: boolean;
  get: (key: string) => Record<string, any>;
  refetch: () => Promise<void>;
}

export function useAdminUIConfig(): AdminUIConfig {
  const [configs, setConfigs] = useState<Record<string, Record<string, any>>>({});
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from("admin_ui_config" as any)
        .select("*");

      if (data && data.length > 0) {
        const map: Record<string, Record<string, any>> = {};
        for (const row of data as any[]) {
          map[row.config_key] = typeof row.config_value === "object" ? row.config_value : {};
        }
        setConfigs(map);
      }
    } catch (err) {
      console.error("[UIConfig] Failed to load:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  return {
    configs,
    loading,
    get: (key) => configs[key] || {},
    refetch: load,
  };
}
