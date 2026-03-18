import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Loader2, Crown, Phone, Mail, ArrowRight } from "lucide-react";
import { usePlan, type PlanTier } from "@/hooks/usePlan";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";

const plans: {
  tier: PlanTier;
  title: string;
  subtitle: string;
  description: string;
  bestFor: string[];
  features: string[];
  note?: string;
  popular?: boolean;
}[] = [
  {
    tier: "basic",
    title: "Basic",
    subtitle: "For Owners & Managers (Food Service)",
    description: "Designed for small food businesses to manage food safety easily.",
    bestFor: [
      "Restaurants",
      "Cafes",
      "Juice Bars",
      "Ice Cream Shops",
      "Bakeries",
      "Cloud Kitchens",
      "Catering services",
    ],
    features: [
      "Food Service activities setup",
      "Simplified HACCP Plan (auto-generated)",
      "CCP / OPRP / PRP identification",
      "Critical limits & monitoring",
      "Basic logs (temperature, cleaning, etc.)",
      "Document generation",
      "Fully customizable system",
    ],
    note: "Create a HACCP plan if you don't have one — or manage your existing system digitally instead of paper.",
  },
  {
    tier: "professional",
    title: "HACCP",
    subtitle: "Full HACCP System for Growing Businesses",
    description: "Complete HACCP solution with full risk analysis and multi-process coverage.",
    bestFor: [
      "Large restaurants & central kitchens",
      "Food factories (Manufacturing)",
      "Expanding food businesses",
    ],
    features: [
      "Food Service + Manufacturing processes",
      "Full risk analysis (Severity × Likelihood)",
      "Dynamic CCP / OPRP decision system",
      "Editable HACCP plan",
      "Complete hazard library",
      "SOP & Logs management",
      "Supports up to 3 branches",
      "Fully customizable system",
    ],
    popular: true,
  },
  {
    tier: "premium",
    title: "Compliance",
    subtitle: "Advanced Food Safety & Certification Ready",
    description: "Enterprise-level solution for full compliance, audits, and certifications.",
    bestFor: [
      "Food factories",
      "Multi-branch businesses",
      "Companies preparing for audits (HACCP / ISO)",
    ],
    features: [
      "Everything in HACCP plan",
      "Internal audit tools",
      "Compliance tracking",
      "Full FSMS documentation",
      "PRP programs",
      "SOP management",
      "Multi-branch (unlimited)",
      "Advanced reporting",
      "Fully customizable system",
    ],
  },
];

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
      toast.success(`Switched to ${tier === "basic" ? "Basic" : tier === "professional" ? "HACCP" : "Compliance"} plan`);
      navigate("/dashboard");
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-10">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Choose Your Plan
          </h1>
          <p className="text-sm text-muted-foreground max-w-lg mx-auto">
            Select the plan that fits your food safety management needs. Upgrade or downgrade anytime.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {plans.map((plan) => {
                const isCurrentPlan = plan.tier === currentPlan;

                return (
                  <Card
                    key={plan.tier}
                    className={`relative flex flex-col shadow-sm transition-all ${
                      plan.popular
                        ? "border-primary ring-2 ring-primary/20 scale-[1.01]"
                        : "border-border"
                    } ${isCurrentPlan ? "bg-primary/5" : ""}`}
                  >
                    {plan.popular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <Badge className="bg-primary text-primary-foreground text-xs px-3 py-0.5">
                          <Crown className="w-3 h-3 mr-1" />
                          Recommended
                        </Badge>
                      </div>
                    )}

                    <CardHeader className="pb-3 pt-6 space-y-2">
                      <CardTitle className="text-xl font-bold text-foreground">
                        {plan.title}
                      </CardTitle>
                      <p className="text-xs font-semibold text-primary">{plan.subtitle}</p>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {plan.description}
                      </p>
                      <div className="pt-2">
                        <span className="text-2xl font-extrabold text-foreground">Contact Us</span>
                      </div>
                    </CardHeader>

                    <CardContent className="flex-1 flex flex-col gap-5">
                      {plan.bestFor.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                            Best for
                          </p>
                          <ul className="space-y-1">
                            {plan.bestFor.map((item) => (
                              <li key={item} className="flex items-center gap-1.5 text-xs text-foreground">
                                <ArrowRight className="w-3 h-3 text-primary shrink-0" />
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                          Includes
                        </p>
                        <ul className="space-y-2 flex-1">
                          {plan.features.map((f) => (
                            <li key={f} className="flex items-start gap-2 text-sm text-foreground">
                              <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                              <span>{f}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {plan.note && (
                        <div className="bg-muted/50 rounded-md p-3 text-xs text-muted-foreground leading-relaxed border border-border">
                          💡 {plan.note}
                        </div>
                      )}

                      <div className="mt-auto space-y-2 pt-2">
                        <Button
                          className="w-full"
                          variant={isCurrentPlan ? "outline" : plan.popular ? "default" : "secondary"}
                          disabled={isCurrentPlan || updating !== null}
                          onClick={() => handleSelect(plan.tier)}
                        >
                          {updating === plan.tier && (
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          )}
                          {isCurrentPlan ? "Current Plan" : `Select ${plan.title}`}
                        </Button>
                        {!isCurrentPlan && (
                          <Button className="w-full" variant="ghost" size="sm" asChild>
                            <Link to="/contact">
                              <Phone className="w-3 h-3 mr-1" />
                              Contact Us
                            </Link>
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Global Note */}
            <div className="max-w-3xl mx-auto text-center space-y-4 bg-muted/30 rounded-xl p-6 border border-border">
              <h2 className="text-lg font-bold text-foreground">How FoodPilot Works for You</h2>
              <div className="grid sm:grid-cols-2 gap-3 text-sm text-foreground">
                <div className="flex items-start gap-3 text-left">
                  <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <span><strong>Build your HACCP system</strong> if you don't have one yet</span>
                </div>
                <div className="flex items-start gap-3 text-left">
                  <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <span><strong>Digitize & manage</strong> your existing HACCP system</span>
                </div>
                <div className="flex items-start gap-3 text-left">
                  <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <span><strong>Fully customizable</strong> & editable based on your operation</span>
                </div>
                <div className="flex items-start gap-3 text-left">
                  <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <span><strong>Replace paperwork</strong> with a smart digital system</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Pricing;
