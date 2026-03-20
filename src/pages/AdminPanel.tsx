/**
 * Admin Control Panel — super_admin only.
 * Central hub: Plans, Feature Access, Website CMS, Roles, UI Control.
 */
import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Settings,
  Crown,
  Save,
  Loader2,
  Shield,
  LayoutDashboard,
  ShieldCheck,
  ClipboardList,
  BookOpen,
  Wrench,
  ClipboardCheck,
  FileText,
  Eye,
  EyeOff,
  Star,
  DollarSign,
  Layers,
  Users,
  GitBranch,
  Activity,
  Globe,
  Palette,
  MessageSquare,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  useAdminPlanConfig,
  type AdminPlanDefinition,
  type AdminModuleAccess,
} from "@/hooks/useAdminPlanConfig";
import { useAdminCMS, type CMSSection } from "@/hooks/useAdminCMS";
import { useAdminUIConfig } from "@/hooks/useAdminUIConfig";
import WebsiteContentTab from "@/components/admin/WebsiteContentTab";
import RolesPermissionsTab from "@/components/admin/RolesPermissionsTab";
import UIControlTab from "@/components/admin/UIControlTab";

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
  { value: "full", label: "Full Access", color: "text-emerald-600" },
  { value: "limited", label: "Limited", color: "text-amber-600" },
  { value: "locked", label: "Locked", color: "text-destructive" },
  { value: "hidden", label: "Hidden", color: "text-muted-foreground" },
];

const AccessBadge = ({ access }: { access: string }) => {
  const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    full: "default",
    limited: "secondary",
    locked: "destructive",
    hidden: "outline",
  };
  return (
    <Badge variant={variants[access] || "outline"} className="text-[10px] px-1.5">
      {ACCESS_OPTIONS.find((o) => o.value === access)?.label || access}
    </Badge>
  );
};

// ── Plan Editor ─────────────────────────────────────────────────────
function PlanEditor({ plan, onSave }: { plan: AdminPlanDefinition; onSave: () => void }) {
  const [displayName, setDisplayName] = useState(plan.display_name);
  const [price, setPrice] = useState(String(plan.price));
  const [description, setDescription] = useState(plan.description);
  const [features, setFeatures] = useState(plan.features.join("\n"));
  const [highlighted, setHighlighted] = useState(plan.highlighted);
  const [visible, setVisible] = useState(plan.visible);
  const [maxBranches, setMaxBranches] = useState(String(plan.max_branches));
  const [maxActivities, setMaxActivities] = useState(String(plan.max_activities));
  const [maxUsers, setMaxUsers] = useState(String(plan.max_users));
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("admin_plan_definitions" as any)
      .update({
        display_name: displayName,
        price: Number(price) || 0,
        description,
        features: features.split("\n").filter((f) => f.trim()),
        highlighted,
        visible,
        max_branches: Number(maxBranches) || 1,
        max_activities: Number(maxActivities) || 1,
        max_users: Number(maxUsers) || 2,
        updated_at: new Date().toISOString(),
      } as any)
      .eq("plan_tier", plan.plan_tier);

    if (error) {
      toast.error("Failed to save plan", { description: error.message });
    } else {
      toast.success(`${displayName} plan saved`);
      onSave();
    }
    setSaving(false);
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-base flex items-center gap-2">
          {plan.highlighted && <Star className="w-4 h-4 text-amber-500 fill-amber-500" />}
          {plan.display_name}
          <Badge variant="outline" className="text-[10px] ml-auto font-mono">{plan.plan_tier}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Display Name</Label>
            <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="h-8 text-sm" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs flex items-center gap-1"><DollarSign className="w-3 h-3" /> Price</Label>
            <Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} className="h-8 text-sm" />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Description</Label>
          <Input value={description} onChange={(e) => setDescription(e.target.value)} className="h-8 text-sm" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Features (one per line)</Label>
          <Textarea value={features} onChange={(e) => setFeatures(e.target.value)} rows={4} className="text-xs" />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs flex items-center gap-1"><GitBranch className="w-3 h-3" /> Max Branches</Label>
            <Input type="number" value={maxBranches} onChange={(e) => setMaxBranches(e.target.value)} className="h-8 text-sm" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs flex items-center gap-1"><Activity className="w-3 h-3" /> Max Activities</Label>
            <Input type="number" value={maxActivities} onChange={(e) => setMaxActivities(e.target.value)} className="h-8 text-sm" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs flex items-center gap-1"><Users className="w-3 h-3" /> Max Users</Label>
            <Input type="number" value={maxUsers} onChange={(e) => setMaxUsers(e.target.value)} className="h-8 text-sm" />
          </div>
        </div>
        <Separator />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-xs cursor-pointer">
              <Switch checked={highlighted} onCheckedChange={setHighlighted} />
              <span className="flex items-center gap-1"><Star className="w-3 h-3" /> Recommended</span>
            </label>
            <label className="flex items-center gap-2 text-xs cursor-pointer">
              <Switch checked={visible} onCheckedChange={setVisible} />
              <span className="flex items-center gap-1">{visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />} Visible</span>
            </label>
          </div>
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Save className="w-3.5 h-3.5 mr-1" />}
            Save
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Module Access Grid ──────────────────────────────────────────────
function ModuleAccessGrid({
  plans, moduleAccess, onSave,
}: {
  plans: AdminPlanDefinition[];
  moduleAccess: AdminModuleAccess[];
  onSave: () => void;
}) {
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
        .update({
          access: entry.access,
          locked_message: entry.locked_message,
          limited_note: entry.limited_note,
          updated_at: new Date().toISOString(),
        } as any)
        .eq("plan_tier", entry.plan_tier)
        .eq("module", entry.module);
      if (error) { hasError = true; console.error("Failed to update:", entry, error); }
    }
    if (hasError) toast.error("Some entries failed to save");
    else { toast.success("Module access saved"); onSave(); }
    setSaving(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Module Access Matrix</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Control what each plan can access. Click a cell to edit.</p>
        </div>
        <Button size="sm" onClick={handleSaveAll} disabled={saving}>
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Save className="w-3.5 h-3.5 mr-1" />}
          Save All
        </Button>
      </div>
      <div className="overflow-x-auto border rounded-lg">
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
                    <mod.icon className="w-3.5 h-3.5 text-muted-foreground" />
                    {mod.label}
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
                          <AccessBadge access={access?.access || "full"} />
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
  );
}

// ── Main Admin Panel ────────────────────────────────────────────────
export default function AdminPanel() {
  const { plans, moduleAccess, loading, refetch } = useAdminPlanConfig();
  const cms = useAdminCMS();
  const uiConfig = useAdminUIConfig();

  const isLoading = loading || cms.loading || uiConfig.loading;

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-5xl">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Crown className="w-5 h-5 text-primary" />
            System Control Panel
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Full platform control — plans, content, permissions, and UI behavior.
          </p>
        </div>

        <Tabs defaultValue="plans" className="space-y-4">
          <TabsList className="flex-wrap h-auto gap-1 p-1">
            <TabsTrigger value="plans" className="text-xs gap-1.5">
              <Layers className="w-3.5 h-3.5" /> Plans & Pricing
            </TabsTrigger>
            <TabsTrigger value="access" className="text-xs gap-1.5">
              <Shield className="w-3.5 h-3.5" /> Feature Access
            </TabsTrigger>
            <TabsTrigger value="website" className="text-xs gap-1.5">
              <Globe className="w-3.5 h-3.5" /> Website Content
            </TabsTrigger>
            <TabsTrigger value="roles" className="text-xs gap-1.5">
              <Users className="w-3.5 h-3.5" /> Roles & Permissions
            </TabsTrigger>
            <TabsTrigger value="ui" className="text-xs gap-1.5">
              <Palette className="w-3.5 h-3.5" /> UI & Messages
            </TabsTrigger>
          </TabsList>

          <TabsContent value="plans" className="space-y-4">
            <p className="text-xs text-muted-foreground">
              Edit plan names, pricing, features, and limits. Changes apply immediately.
            </p>
            <div className="grid gap-4">
              {plans.map((plan) => (
                <PlanEditor key={plan.plan_tier} plan={plan} onSave={refetch} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="access" className="space-y-4">
            <ModuleAccessGrid plans={plans} moduleAccess={moduleAccess} onSave={refetch} />
          </TabsContent>

          <TabsContent value="website" className="space-y-4">
            <WebsiteContentTab sections={cms.sections} onSave={() => window.location.reload()} />
          </TabsContent>

          <TabsContent value="roles" className="space-y-4">
            <RolesPermissionsTab />
          </TabsContent>

          <TabsContent value="ui" className="space-y-4">
            <UIControlTab configs={uiConfig.configs} onSave={uiConfig.refetch} />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
