/**
 * Admin tab for editing website CMS content (hero, features, pricing, etc.)
 */
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Save, Loader2, Eye, EyeOff, GripVertical, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { CMSSection } from "@/hooks/useAdminCMS";

interface Props {
  sections: Record<string, CMSSection>;
  onSave: () => void;
}

const SECTION_LABELS: Record<string, string> = {
  hero: "Hero Section",
  trust_strip: "Trust Strip",
  problem: "Problem Section",
  solution: "Solution Section",
  features: "Features Section",
  cta: "Call to Action",
  contact: "Contact Section",
  targets: "Target Users",
};

function SectionEditor({ section, onSave }: { section: CMSSection; onSave: () => void }) {
  const [content, setContent] = useState<Record<string, any>>(section.content);
  const [visible, setVisible] = useState(section.visible);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setContent(section.content);
    setVisible(section.visible);
  }, [section]);

  const updateField = (key: string, value: any) => {
    setContent((prev) => ({ ...prev, [key]: value }));
  };

  const updateListItem = (key: string, index: number, value: string) => {
    const list = [...(content[key] || [])];
    list[index] = value;
    updateField(key, list);
  };

  const addListItem = (key: string) => {
    const list = [...(content[key] || []), ""];
    updateField(key, list);
  };

  const removeListItem = (key: string, index: number) => {
    const list = [...(content[key] || [])];
    list.splice(index, 1);
    updateField(key, list);
  };

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("admin_cms_content" as any)
      .update({ content, visible, updated_at: new Date().toISOString() } as any)
      .eq("section_key", section.section_key);

    if (error) {
      toast.error("Failed to save", { description: error.message });
    } else {
      toast.success(`${SECTION_LABELS[section.section_key] || section.section_key} saved`);
      onSave();
    }
    setSaving(false);
  };

  const renderField = (key: string, value: any) => {
    if (key === "items" && Array.isArray(value)) {
      // Check if items are objects (features) or strings (problems/solutions)
      if (value.length > 0 && typeof value[0] === "object") {
        return (
          <div key={key} className="space-y-2">
            <Label className="text-xs font-medium">Items</Label>
            {value.map((item: any, i: number) => (
              <div key={i} className="flex gap-2 items-start">
                <div className="flex-1 space-y-1">
                  <Input
                    value={item.title || ""}
                    onChange={(e) => {
                      const list = [...value];
                      list[i] = { ...list[i], title: e.target.value };
                      updateField(key, list);
                    }}
                    placeholder="Title"
                    className="h-7 text-xs"
                  />
                  <Input
                    value={item.desc || item.value || ""}
                    onChange={(e) => {
                      const list = [...value];
                      const field = "desc" in item ? "desc" : "value";
                      list[i] = { ...list[i], [field]: e.target.value };
                      updateField(key, list);
                    }}
                    placeholder="Description"
                    className="h-7 text-xs"
                  />
                </div>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={() => removeListItem(key, i)}>
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            ))}
            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => {
              const list = [...value, { title: "", desc: "" }];
              updateField(key, list);
            }}>
              <Plus className="w-3 h-3 mr-1" /> Add Item
            </Button>
          </div>
        );
      }
      // String list
      return (
        <div key={key} className="space-y-2">
          <Label className="text-xs font-medium">Items</Label>
          {value.map((item: string, i: number) => (
            <div key={i} className="flex gap-2">
              <Input
                value={item}
                onChange={(e) => updateListItem(key, i, e.target.value)}
                className="h-7 text-xs flex-1"
              />
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={() => removeListItem(key, i)}>
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          ))}
          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => addListItem(key)}>
            <Plus className="w-3 h-3 mr-1" /> Add
          </Button>
        </div>
      );
    }

    if (typeof value === "string") {
      const isLong = value.length > 80;
      return (
        <div key={key} className="space-y-1">
          <Label className="text-xs font-medium capitalize">{key.replace(/_/g, " ")}</Label>
          {isLong ? (
            <Textarea value={value} onChange={(e) => updateField(key, e.target.value)} rows={2} className="text-xs" />
          ) : (
            <Input value={value} onChange={(e) => updateField(key, e.target.value)} className="h-7 text-xs" />
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center justify-between">
          <span className="flex items-center gap-2">
            <GripVertical className="w-3.5 h-3.5 text-muted-foreground" />
            {SECTION_LABELS[section.section_key] || section.section_key}
          </span>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 text-xs cursor-pointer font-normal">
              <Switch checked={visible} onCheckedChange={setVisible} />
              {visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            </label>
            <Badge variant="outline" className="text-[9px] font-mono">{section.section_key}</Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {Object.entries(content).map(([key, value]) => renderField(key, value))}
        <Separator />
        <div className="flex justify-end">
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Save className="w-3.5 h-3.5 mr-1" />}
            Save
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function WebsiteContentTab({ sections, onSave }: Props) {
  const ordered = Object.values(sections).sort((a, b) => a.sort_order - b.sort_order);

  if (ordered.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground text-sm">
        No CMS content found. Content will be seeded automatically.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Edit website content, show/hide sections, and update text. Changes apply to the public landing page.
      </p>
      {ordered.map((section) => (
        <SectionEditor key={section.section_key} section={section} onSave={onSave} />
      ))}
    </div>
  );
}
