/**
 * Admin Feature Access page — module access matrix.
 */
import { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Save, Loader2, Shield, LayoutDashboard, ShieldCheck,
  ClipboardList, BookOpen, Wrench, ClipboardCheck, FileText, Settings,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAdminPlanConfig, type AdminPlanDefinition, type AdminModuleAccess } from "@/hooks/useAdminPlanConfig";

const MODULE_LIST = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "haccp_plan", label: "HACCP Plan", icon: ShieldCheck },
  { key: "logs", label: "Logs", icon: ClipboardList },
  { key: "prp", label: "PRP Programs", icon: Shield },
  { key: "sop", label: "SOP Procedures", icon: BookOpen },
  { key: "equipment", label: "Equipment", icon: Wrench },
  { key: "audit", label: "Audit Ready", icon: ClipboardCheck },
  { key: "documents", label: "Documents", icon: FileText },
  { key: "settings", label: "Settings", icon: Settings },
];

const ACCESS_OPTIONS = [
  { value: "full", label: "Full Access" },
  { value: "limited", label: "Limited" },
  { value: "locked", label: "Locked" },
  { value: "hidden", label: "Hidden" },
];

export default function AdminAccess() {
  const { plans, moduleAccess, loading, refetch } = useAdminPlanConfig();
  const [localAccess, setLocalAccess] = useState<AdminModuleAccess[]>(moduleAccess);
  const [editingCell, setEditingCell] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { setLocalAccess(moduleAccess); }, [moduleAccess]);

  const getAccess = (planTier: string, module: string) =>
    localAccess.find((a) => a.plan_tier === planTier && a.module === module);

  const updateAccess = (planTier: string, module: string, newAccess: string) => {
    setLocalAccess((prev) =>
      prev.map((a) => a.plan_tier === planTier && a.module === module ? { ...a, access: newAccess as any } : a)
    );
  };

  const updateMessage = (planTier: string, module: string, field: "locked_message" | "limited_note", value: string) => {
    setLocalAccess((prev) =>
      prev.map((a) => a.plan_tier === planTier && a.module === module ? { ...a, [field]: value || null } : a)
    );
  };

  const handleSaveAll = async () => {
    setSaving(true);
    let hasError = false;
    for (const entry of localAccess) {
      const { error } = await supabase
        .from("admin_module_access" as any)
        .update({ access: entry.access, locked_message: entry.locked_message, limited_note: entry.limited_note, updated_at: new Date().toISOString() } as any)
        .eq("plan_tier", entry.plan_tier)
        .eq("module", entry.module);
      if (error) { hasError = true; }
    }
    if (hasError) toast.error("Some entries failed to save");
    else { toast.success("Module access saved"); refetch(); }
    setSaving(false);
  };

  if (loading) {
    return <AdminLayout><div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div></AdminLayout>;
  }

  const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = { full: "default", limited: "secondary", locked: "destructive", hidden: "outline" };

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-5xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" /> Feature Access Matrix
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Control what each plan can access. Click a cell to edit.</p>
          </div>
          <Button size="sm" onClick={handleSaveAll} disabled={saving}>
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Save className="w-3.5 h-3.5 mr-1" />}
            Save All
          </Button>
        </div>

        <div className="overflow-x-auto border rounded-lg bg-background">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-2.5 font-medium text-muted-foreground w-[160px]">Module</th>
                {plans.map((p) => (
                  <th key={p.plan_tier} className="text-center p-2.5 font-medium text-muted-foreground">{p.display_name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MODULE_LIST.map((mod) => (
                <tr key={mod.key} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="p-2.5">
                    <span className="flex items-center gap-1.5 font-medium">
                      <mod.icon className="w-3.5 h-3.5 text-muted-foreground" />{mod.label}
                    </span>
                  </td>
                  {plans.map((plan) => {
                    const access = getAccess(plan.plan_tier, mod.key);
                    const key = `${plan.plan_tier}:${mod.key}`;
                    const isEditing = editingCell === key;
                    return (
                      <td key={plan.plan_tier} className="p-2 text-center">
                        {isEditing ? (
                          <div className="space-y-1.5">
                            <Select value={access?.access || "full"} onValueChange={(v) => updateAccess(plan.plan_tier, mod.key, v)}>
                              <SelectTrigger className="h-7 text-[11px]"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {ACCESS_OPTIONS.map((opt) => (
                                  <SelectItem key={opt.value} value={opt.value} className="text-xs">{opt.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {access?.access === "locked" && (
                              <Input placeholder="Lock message..." value={access?.locked_message || ""} onChange={(e) => updateMessage(plan.plan_tier, mod.key, "locked_message", e.target.value)} className="h-6 text-[10px]" />
                            )}
                            {access?.access === "limited" && (
                              <Input placeholder="Limited note..." value={access?.limited_note || ""} onChange={(e) => updateMessage(plan.plan_tier, mod.key, "limited_note", e.target.value)} className="h-6 text-[10px]" />
                            )}
                            <Button size="sm" variant="ghost" className="h-5 text-[10px] px-2" onClick={() => setEditingCell(null)}>Done</Button>
                          </div>
                        ) : (
                          <button onClick={() => setEditingCell(key)} className="inline-flex hover:scale-105 transition-transform">
                            <Badge variant={variants[access?.access || "full"] || "outline"} className="text-[10px] px-1.5">
                              {ACCESS_OPTIONS.find((o) => o.value === (access?.access || "full"))?.label}
                            </Badge>
                          </button>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
