import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Database, Table, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

interface TableInfo {
  name: string;
  count: number | null;
  status: "loading" | "ok" | "error";
}

const TABLE_NAMES = [
  "templates", "activity_types", "process_steps", "activity_process_map",
  "hazard_library", "process_hazard_map", "process_step_hazard_map",
  "ccp_table", "ccp_analysis", "decision_tree_questions",
  "logs_structure", "logs_structure_manufacturing",
  "equipment_library", "business_equipment",
  "prp_programs", "sop_library", "sop_library_manufacturing", "document_library",
  "organizations", "branches", "profiles", "user_roles",
];

export default function DatabaseStatus() {
  const [tables, setTables] = useState<TableInfo[]>(
    TABLE_NAMES.map((name) => ({ name, count: null, status: "loading" }))
  );

  useEffect(() => {
    TABLE_NAMES.forEach(async (name, i) => {
      try {
        const { count, error } = await supabase
          .from(name)
          .select("*", { count: "exact", head: true });
        setTables((prev) => {
          const next = [...prev];
          next[i] = { name, count: error ? null : count, status: error ? "error" : "ok" };
          return next;
        });
      } catch {
        setTables((prev) => {
          const next = [...prev];
          next[i] = { name, count: null, status: "error" };
          return next;
        });
      }
    });
  }, []);

  const totalRecords = tables.reduce((s, t) => s + (t.count ?? 0), 0);
  const readyCount = tables.filter((t) => t.status === "ok").length;

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Tables", value: TABLE_NAMES.length, icon: Database },
          { label: "Ready", value: readyCount, icon: CheckCircle },
          { label: "Total Records", value: totalRecords, icon: Table },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="bg-card rounded-lg p-4 shadow-industrial-sm">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Icon className="w-3.5 h-3.5" />
              {label}
            </div>
            <div className="text-2xl font-semibold tracking-tight font-display text-foreground">
              {value}
            </div>
          </div>
        ))}
      </div>

      {/* Table list */}
      <div className="bg-card rounded-lg shadow-industrial-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground">Database Tables</h3>
        </div>
        <div className="divide-y divide-border">
          {tables.map((t) => (
            <div key={t.name} className="flex items-center justify-between px-4 py-2.5 hover-lift">
              <div className="flex items-center gap-2.5">
                {t.status === "loading" ? (
                  <Loader2 className="w-3.5 h-3.5 text-muted-foreground animate-spin" />
                ) : t.status === "ok" ? (
                  <CheckCircle className="w-3.5 h-3.5 text-success" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5 text-destructive" />
                )}
                <span className="text-sm text-foreground font-mono">{t.name}</span>
              </div>
              <span className="text-xs text-muted-foreground font-mono tabular-nums">
                {t.count !== null ? `${t.count} rows` : "—"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
