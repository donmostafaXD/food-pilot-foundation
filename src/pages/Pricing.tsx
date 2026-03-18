import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Loader2, Crown } from "lucide-react";
import { usePlan, PLAN_CONFIG, type PlanTier } from "@/hooks/usePlan";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";

const tiers: PlanTier[] = ["basic", "professional", "premium"];

const Pricing = () => {
  const { plan: currentPlan, loading, updatePlan } = usePlan();
  const [updating, setUpdating] = useState<PlanTier | null>(null);
  const navigate = useNavigate();

  const handleSelect = async (tier: PlanTier) => {
    if (tier === currentPlan) return;
    setUpdating(tier);
    const { error } = await updatePlan(tier);
    setUpdating(null);

    if (error) {
      toast.error("Failed to update plan", { description: error.message });
    } else {
      toast.success(`Switched to ${PLAN_CONFIG[tier].name} plan`);
      navigate("/dashboard");
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Choose Your Plan
          </h1>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Select the plan that fits your food safety management needs. Upgrade or downgrade anytime.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {tiers.map((tier) => {
              const config = PLAN_CONFIG[tier];
              const isCurrentPlan = tier === currentPlan;
              const isRecommended = tier === "professional";

              return (
                <Card
                  key={tier}
                  className={`relative flex flex-col shadow-industrial-sm transition-all ${
                    isRecommended
                      ? "border-primary ring-2 ring-primary/20 scale-[1.02]"
                      : "border-border"
                  } ${isCurrentPlan ? "bg-primary/5" : ""}`}
                >
                  {isRecommended && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-primary text-primary-foreground text-xs px-3 py-0.5">
                        <Crown className="w-3 h-3 mr-1" />
                        Recommended
                      </Badge>
                    </div>
                  )}

                  <CardHeader className="pb-4 pt-6">
                    <CardTitle className="text-lg font-bold text-foreground">
                      {config.name}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">
                      {config.description}
                    </p>
                    <div className="mt-4">
                      <span className="text-3xl font-extrabold tabular-nums text-foreground">
                        ${config.price}
                      </span>
                      <span className="text-sm text-muted-foreground">/month</span>
                    </div>
                  </CardHeader>

                  <CardContent className="flex-1 flex flex-col gap-4">
                    <ul className="space-y-2.5 flex-1">
                      {config.features.map((f) => (
                        <li key={f} className="flex items-start gap-2 text-sm text-foreground">
                          <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>

                    <Button
                      className="w-full mt-2"
                      variant={isCurrentPlan ? "outline" : isRecommended ? "default" : "secondary"}
                      disabled={isCurrentPlan || updating !== null}
                      onClick={() => handleSelect(tier)}
                    >
                      {updating === tier ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : null}
                      {isCurrentPlan ? "Current Plan" : `Select ${config.name}`}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Pricing;
