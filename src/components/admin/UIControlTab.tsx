/**
 * Admin tab for UI control: upgrade messages, sidebar config.
 */
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Save, Loader2, MessageSquare, Layout } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  configs: Record<string, Record<string, any>>;
  onSave: () => void;
}

export default function UIControlTab({ configs, onSave }: Props) {
  const [upgradeMessages, setUpgradeMessages] = useState<Record<string, string>>(
    (configs["upgrade_messages"] as Record<string, string>) || {}
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (configs["upgrade_messages"]) {
      setUpgradeMessages(configs["upgrade_messages"] as Record<string, string>);
    }
  }, [configs]);

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("admin_ui_config" as any)
      .update({ config_value: upgradeMessages, updated_at: new Date().toISOString() } as any)
      .eq("config_key", "upgrade_messages");

    if (error) {
      toast.error("Failed to save", { description: error.message });
    } else {
      toast.success("Upgrade messages saved");
      onSave();
    }
    setSaving(false);
  };

  const messageKeys = [
    { key: "default", label: "Default Message" },
    { key: "sop", label: "SOP Locked Message" },
    { key: "prp", label: "PRP Locked Message" },
    { key: "documents", label: "Documents Locked Message" },
    { key: "equipment", label: "Equipment Locked Message" },
  ];

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Customize upgrade prompts and UI messages shown to users when features are locked.
      </p>

      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-primary" />
            Upgrade Messages
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {messageKeys.map(({ key, label }) => (
            <div key={key} className="space-y-1">
              <Label className="text-xs">{label}</Label>
              <Textarea
                value={upgradeMessages[key] || ""}
                onChange={(e) => setUpgradeMessages((prev) => ({ ...prev, [key]: e.target.value }))}
                rows={2}
                className="text-xs"
              />
            </div>
          ))}
          <div className="flex justify-end pt-2">
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Save className="w-3.5 h-3.5 mr-1" />}
              Save Messages
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
