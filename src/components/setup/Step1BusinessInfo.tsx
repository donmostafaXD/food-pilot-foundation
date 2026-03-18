import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Lock } from "lucide-react";

interface Props {
  businessName: string;
  setBusinessName: (v: string) => void;
  businessType: "" | "Food Service" | "Manufacturing";
  setBusinessType: (v: "" | "Food Service" | "Manufacturing") => void;
  orgName: string;
  canAccessManufacturing?: boolean;
}

const Step1BusinessInfo = ({ businessName, setBusinessName, businessType, setBusinessType, orgName }: Props) => {
  const { profile } = useAuth();

  // Pre-fill business name from organization
  useEffect(() => {
    if (!businessName && profile?.organization_id) {
      supabase
        .from("organizations")
        .select("name")
        .eq("id", profile.organization_id)
        .single()
        .then(({ data }) => {
          if (data?.name) setBusinessName(data.name);
        });
    }
  }, [profile?.organization_id]);

  return (
    <div className="space-y-6 max-w-md">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Business Information</h2>
        <p className="text-sm text-muted-foreground mt-1">Tell us about your business</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="businessName">Business Name</Label>
        <Input
          id="businessName"
          value={businessName}
          onChange={(e) => setBusinessName(e.target.value)}
          placeholder="Enter business name"
        />
      </div>

      <div className="space-y-3">
        <Label>Business Type</Label>
        <RadioGroup
          value={businessType}
          onValueChange={(v) => setBusinessType(v as "Food Service" | "Manufacturing")}
          className="space-y-2"
        >
          <div className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-secondary/50 cursor-pointer transition-industrial">
            <RadioGroupItem value="Food Service" id="food-service" />
            <Label htmlFor="food-service" className="cursor-pointer flex-1">
              <span className="font-medium">Food Service</span>
              <span className="block text-xs text-muted-foreground">Restaurants, bakeries, cafes, juice bars</span>
            </Label>
          </div>
          <div className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-secondary/50 cursor-pointer transition-industrial">
            <RadioGroupItem value="Manufacturing" id="manufacturing" />
            <Label htmlFor="manufacturing" className="cursor-pointer flex-1">
              <span className="font-medium">Manufacturing</span>
              <span className="block text-xs text-muted-foreground">Food production, dairy, meat, beverages</span>
            </Label>
          </div>
        </RadioGroup>
      </div>
    </div>
  );
};

export default Step1BusinessInfo;
