import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface ActivityType {
  id: number;
  activity_name: string;
  template: string;
  industry_type: string | null;
}

interface Props {
  businessType: string;
  selectedActivity: string;
  setSelectedActivity: (v: string) => void;
  setSelectedTemplate: (v: string) => void;
  canAccessManufacturing?: boolean;
}

const Step2ActivitySelection = ({
  businessType,
  selectedActivity,
  setSelectedActivity,
  setSelectedTemplate,
  canAccessManufacturing = true,
}: Props) => {
  const [activities, setActivities] = useState<ActivityType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);

      const effectiveBusinessType = canAccessManufacturing ? businessType : "Food Service";
      let query = supabase.from("activity_types").select("*");

      if (effectiveBusinessType === "Food Service") {
        query = query.in("template", ["Food Service", "Bakery"]);
      } else {
        query = query.eq("template", "Manufacturing");
      }

      const { data, error } = await query.order("activity_name", { ascending: true });
      const nextActivities = error ? [] : (data || []);
      setActivities(nextActivities);

      if (selectedActivity && !nextActivities.some((act) => act.activity_name === selectedActivity)) {
        setSelectedActivity("");
        setSelectedTemplate("");
      }

      setLoading(false);
    };

    void load();
  }, [businessType, canAccessManufacturing, selectedActivity, setSelectedActivity, setSelectedTemplate]);

  const handleSelect = (act: ActivityType) => {
    setSelectedActivity(act.activity_name);
    setSelectedTemplate(act.template);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Select Your Activity</h2>
        <p className="text-sm text-muted-foreground mt-1">Choose the type of food activity for this branch</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {activities.map((act) => (
          <button
            key={act.id}
            onClick={() => handleSelect(act)}
            className={`p-4 rounded-lg border text-left transition-industrial ${
              selectedActivity === act.activity_name
                ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                : "border-border hover:border-primary/40 hover:bg-secondary/30"
            }`}
          >
            <span className="font-medium text-foreground text-sm">{act.activity_name}</span>
            <span className="block text-xs text-muted-foreground mt-1">{act.template}</span>
          </button>
        ))}
      </div>

      {activities.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">No activities found for this business type.</p>
      )}
    </div>
  );
};

export default Step2ActivitySelection;
