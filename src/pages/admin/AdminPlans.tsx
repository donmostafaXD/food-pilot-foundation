/**
 * Admin Plans & Pricing page — extracted from the old AdminPanel tab.
 */
import { useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Save, Loader2, Eye, EyeOff, Star, DollarSign,
  GitBranch, Activity, Users, Layers,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAdminPlanConfig, type AdminPlanDefinition } from "@/hooks/useAdminPlanConfig";

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

    if (error) toast.error("Failed to save plan", { description: error.message });
    else { toast.success(`${displayName} plan saved`); onSave(); }
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

export default function AdminPlans() {
  const { plans, loading, refetch } = useAdminPlanConfig();

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-5xl">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Layers className="w-5 h-5 text-primary" />
            Plans & Pricing
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Edit plan names, pricing, features, and limits.</p>
        </div>
        <div className="grid gap-4">
          {plans.map((plan) => (
            <PlanEditor key={plan.plan_tier} plan={plan} onSave={refetch} />
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
