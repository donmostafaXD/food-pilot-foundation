/**
 * Hook to load CMS content from admin_cms_content table.
 * Used by public pages (Home) to render admin-managed content.
 */
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface CMSSection {
  section_key: string;
  content: Record<string, any>;
  visible: boolean;
  sort_order: number;
}

interface AdminCMS {
  sections: Record<string, CMSSection>;
  loading: boolean;
  get: (key: string) => CMSSection | undefined;
  getContent: <T = Record<string, any>>(key: string) => T | undefined;
  isVisible: (key: string) => boolean;
}

export function useAdminCMS(): AdminCMS {
  const [sections, setSections] = useState<Record<string, CMSSection>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await supabase
          .from("admin_cms_content" as any)
          .select("*")
          .order("sort_order");

        if (data && data.length > 0) {
          const map: Record<string, CMSSection> = {};
          for (const row of data as any[]) {
            map[row.section_key] = {
              section_key: row.section_key,
              content: typeof row.content === "object" ? row.content : {},
              visible: row.visible ?? true,
              sort_order: row.sort_order ?? 0,
            };
          }
          setSections(map);
        }
      } catch (err) {
        console.error("[CMS] Failed to load:", err);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  return {
    sections,
    loading,
    get: (key) => sections[key],
    getContent: <T,>(key: string) => sections[key]?.content as T | undefined,
    isVisible: (key) => sections[key]?.visible !== false,
  };
}
