import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, AlertTriangle, Activity } from "lucide-react";

interface PlanSummary {
  id: string;
  activity_name: string;
  business_type: string;
  status: string;
  ccpCount: number;
  oprpCount: number;
  prpCount: number;
  totalHazards: number;
}

const HACCPSummary = () => {
  const { profile } = useAuth();
  const [summary, setSummary] = useState<PlanSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!profile?.branch_id) {
        setLoading(false);
        return;
      }

      const { data: plans } = await supabase
        .from("haccp_plans")
        .select("*")
        .eq("branch_id", profile.branch_id)
        .order("created_at", { ascending: false })
        .limit(1);

      if (!plans || plans.length === 0) {
        setLoading(false);
        return;
      }

      const plan = plans[0];

      // Get steps and hazards
      const { data: steps } = await supabase
        .from("haccp_plan_steps")
        .select("id")
        .eq("haccp_plan_id", plan.id);

      const stepIds = (steps || []).map((s) => s.id);

      let ccpCount = 0, oprpCount = 0, prpCount = 0, totalHazards = 0;

      if (stepIds.length > 0) {
        const { data: hazards } = await supabase
          .from("haccp_plan_hazards")
          .select("risk_score")
          .in("haccp_plan_step_id", stepIds);

        (hazards || []).forEach((h) => {
          totalHazards++;
          if (h.risk_score >= 12) ccpCount++;
          else if (h.risk_score >= 8) oprpCount++;
          else prpCount++;
        });
      }

      setSummary({
        id: plan.id,
        activity_name: plan.activity_name,
        business_type: plan.business_type,
        status: plan.status,
        ccpCount,
        oprpCount,
        prpCount,
        totalHazards,
      });
      setLoading(false);
    };
    load();
  }, [profile?.branch_id]);

  if (loading) return null;
  if (!summary) return null;

  return (
    <Card className="shadow-industrial-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-primary" />
          HACCP Plan
          <Badge variant="outline" className="ml-auto text-xs capitalize">{summary.status}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          {summary.activity_name} • {summary.business_type}
        </p>
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 rounded-lg bg-destructive/10">
            <AlertTriangle className="w-4 h-4 mx-auto text-destructive mb-1" />
            <span className="text-2xl font-bold tabular-nums text-destructive">{summary.ccpCount}</span>
            <p className="text-xs text-muted-foreground mt-0.5">CCPs</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-warning/10">
            <Activity className="w-4 h-4 mx-auto text-warning mb-1" />
            <span className="text-2xl font-bold tabular-nums text-warning">{summary.oprpCount}</span>
            <p className="text-xs text-muted-foreground mt-0.5">Medium Risk</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted">
            <ShieldCheck className="w-4 h-4 mx-auto text-muted-foreground mb-1" />
            <span className="text-2xl font-bold tabular-nums text-foreground">{summary.prpCount}</span>
            <p className="text-xs text-muted-foreground mt-0.5">Low Risk</p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-3 text-center">
          {summary.totalHazards} total hazards identified
        </p>
      </CardContent>
    </Card>
  );
};

export default HACCPSummary;
