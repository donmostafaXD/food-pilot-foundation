import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Trash2, Save } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SetupItem {
  id?: string;
  category: string;
  item_name: string;
  item_value: string | null;
  activity: string | null;
  isNew?: boolean;
}

// Categories shown per activity type
const FOOD_SERVICE_ACTIVITIES = [
  "restaurant", "cafe", "bakery", "juice bar", "ice cream shop", "catering", "cloud kitchen",
];

interface CategoryConfig {
  key: string;
  label: string;
  placeholder: string;
  valuePlaceholder?: string;
  advanced?: boolean; // only for manufacturing/advanced activities
}

const ALL_CATEGORIES: CategoryConfig[] = [
  { key: "cleaning_chemicals", label: "Cleaning Chemicals", placeholder: "e.g. Chlorine Solution" },
  { key: "equipment", label: "Equipment List", placeholder: "e.g. Walk-in Freezer", valuePlaceholder: "Model / specs" },
  { key: "suppliers", label: "Supplier Names", placeholder: "e.g. Fresh Foods Co.", valuePlaceholder: "Contact / address" },
  { key: "storage_areas", label: "Storage Areas", placeholder: "e.g. Dry Storage Room A" },
  { key: "waste_disposal", label: "Waste Disposal Methods", placeholder: "e.g. Licensed waste contractor" },
  { key: "temperature_standards", label: "Temperature Standards", placeholder: "e.g. Cold Storage", valuePlaceholder: "Standard (e.g. ≤5°C)" },
  { key: "process_notes", label: "Process-Specific Notes", placeholder: "e.g. Pasteurization", valuePlaceholder: "Details", advanced: true },
];

interface Props {
  activityName: string;
}

const FoodSafetySetupSection = ({ activityName }: Props) => {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<SetupItem[]>([]);
  const [saving, setSaving] = useState(false);

  const isBasicActivity = FOOD_SERVICE_ACTIVITIES.includes(activityName.toLowerCase());
  const visibleCategories = isBasicActivity
    ? ALL_CATEGORIES.filter((c) => !c.advanced)
    : ALL_CATEGORIES;

  useEffect(() => {
    if (!profile?.organization_id) return;
    const load = async () => {
      const { data } = await supabase
        .from("food_safety_setup")
        .select("*")
        .eq("organization_id", profile.organization_id!);
      setItems(
        (data || []).map((d: any) => ({
          id: d.id,
          category: d.category,
          item_name: d.item_name,
          item_value: d.item_value,
          activity: d.activity,
        }))
      );
      setLoading(false);
    };
    load();
  }, [profile?.organization_id]);

  const addItem = (category: string) => {
    setItems((prev) => [
      ...prev,
      { category, item_name: "", item_value: null, activity: activityName, isNew: true },
    ]);
  };

  const removeItem = async (index: number) => {
    const item = items[index];
    if (item.id) {
      await supabase.from("food_safety_setup").delete().eq("id", item.id);
    }
    setItems((prev) => prev.filter((_, i) => i !== index));
    toast.success("Item removed");
  };

  const updateItem = (index: number, field: "item_name" | "item_value", value: string) => {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  };

  const handleSave = async () => {
    if (!profile?.organization_id) return;
    setSaving(true);
    try {
      // Save new items
      const newItems = items.filter((i) => i.isNew && i.item_name.trim());
      if (newItems.length > 0) {
        const { error } = await supabase.from("food_safety_setup").insert(
          newItems.map((i) => ({
            organization_id: profile.organization_id!,
            category: i.category,
            item_name: i.item_name.trim(),
            item_value: i.item_value?.trim() || null,
            activity: i.activity,
          }))
        );
        if (error) throw error;
      }

      // Update existing items
      const existingItems = items.filter((i) => i.id && !i.isNew);
      for (const item of existingItems) {
        await supabase
          .from("food_safety_setup")
          .update({ item_name: item.item_name, item_value: item.item_value })
          .eq("id", item.id!);
      }

      // Reload
      const { data } = await supabase
        .from("food_safety_setup")
        .select("*")
        .eq("organization_id", profile.organization_id!);
      setItems(
        (data || []).map((d: any) => ({
          id: d.id,
          category: d.category,
          item_name: d.item_name,
          item_value: d.item_value,
          activity: d.activity,
        }))
      );
      toast.success("Food safety setup saved");
    } catch (err: any) {
      toast.error("Failed to save", { description: err.message });
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Food Safety Setup</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Define custom data used in PRP and SOP documents for your organization.
          </p>
          <Badge variant="secondary" className="mt-1 text-[10px]">
            Activity: {activityName}
          </Badge>
        </div>
        <Button size="sm" onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Save className="w-4 h-4 mr-1" />}
          Save All
        </Button>
      </div>

      {visibleCategories.map((cat) => {
        const catItems = items.filter((i) => i.category === cat.key);
        return (
          <Card key={cat.key} className="shadow-industrial-sm">
            <CardContent className="pt-5 pb-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-foreground">{cat.label}</p>
                <Button variant="ghost" size="sm" onClick={() => addItem(cat.key)}>
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add
                </Button>
              </div>
              {catItems.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">No items added yet.</p>
              ) : (
                <div className="space-y-2">
                  {catItems.map((item) => {
                    const globalIndex = items.indexOf(item);
                    return (
                      <div key={globalIndex} className="flex items-center gap-2">
                        <Input
                          value={item.item_name}
                          onChange={(e) => updateItem(globalIndex, "item_name", e.target.value)}
                          placeholder={cat.placeholder}
                          className="flex-1"
                        />
                        {cat.valuePlaceholder && (
                          <Input
                            value={item.item_value || ""}
                            onChange={(e) => updateItem(globalIndex, "item_value", e.target.value)}
                            placeholder={cat.valuePlaceholder}
                            className="flex-1"
                          />
                        )}
                        <Button variant="ghost" size="icon" className="shrink-0 text-muted-foreground hover:text-destructive" onClick={() => removeItem(globalIndex)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default FoodSafetySetupSection;
