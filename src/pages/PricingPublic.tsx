import { Link } from "react-router-dom";
import PublicLayout from "@/components/PublicLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Crown } from "lucide-react";
import { PLAN_CONFIG, type PlanTier } from "@/hooks/usePlan";

const tiers: { key: PlanTier; popular?: boolean }[] = [
  { key: "basic" },
  { key: "professional", popular: true },
  { key: "premium" },
];

const PricingPublic = () => {
  return (
    <PublicLayout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-24 space-y-12">
        <div className="text-center space-y-3">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
            Simple, Transparent Pricing
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Choose the plan that fits your food safety needs. Upgrade or downgrade anytime.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {tiers.map(({ key, popular }) => {
            const config = PLAN_CONFIG[key];
            return (
              <Card
                key={key}
                className={`relative flex flex-col transition-all ${
                  popular
                    ? "border-primary ring-2 ring-primary/20 scale-[1.02]"
                    : "border-border"
                }`}
              >
                {popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground text-xs px-3 py-0.5">
                      <Crown className="w-3 h-3 mr-1" />
                      Most Popular
                    </Badge>
                  </div>
                )}

                <CardHeader className="pb-4 pt-6">
                  <CardTitle className="text-lg font-bold text-foreground">
                    {config.name}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">{config.description}</p>
                  <div className="mt-4">
                    <span className="text-4xl font-extrabold tabular-nums text-foreground">
                      ${config.price}
                    </span>
                    <span className="text-sm text-muted-foreground">/month</span>
                  </div>
                </CardHeader>

                <CardContent className="flex-1 flex flex-col gap-4">
                  <ul className="space-y-2.5 flex-1">
                    {config.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-foreground">
                        <Check className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    className="w-full mt-2"
                    variant={popular ? "default" : "outline"}
                    asChild
                  >
                    <Link to="/register">Get Started</Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </PublicLayout>
  );
};

export default PricingPublic;