/**
 * Reusable upgrade prompt component for locked/restricted features.
 * Shows contextual messaging about what plan is needed and why.
 */
import { Lock, ArrowUpRight, Sparkles, Crown, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { usePlan, PLAN_DISPLAY_NAMES } from "@/hooks/usePlan";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { PLAN_TIER_LABELS } from "@/lib/plan-features";
import type { PlanTier } from "@/hooks/usePlan";

interface UpgradePromptProps {
  /** Feature/module name being restricted */
  featureName: string;
  /** Minimum plan needed */
  requiredPlan: PlanTier;
  /** Optional custom description */
  description?: string;
  /** Compact inline variant vs full-page */
  variant?: "inline" | "page" | "card";
}

const PLAN_HIGHLIGHTS: Record<PlanTier, string[]> = {
  basic: [],
  professional: [
    "Full risk analysis (S × L)",
    "SOP & PRP management",
    "Equipment registry",
    "Up to 3 branches",
  ],
  premium: [
    "Internal audit tools",
    "Compliance tracking",
    "Full FSMS documentation",
    "Unlimited branches & users",
  ],
};

export function UpgradePrompt({
  featureName,
  requiredPlan,
  description,
  variant = "card",
}: UpgradePromptProps) {
  const { planDisplayName, plan: currentPlan } = usePlan();
  const { effectiveRole } = useRoleAccess();
  const canUpgrade = effectiveRole === "Owner" || effectiveRole === "super_admin";
  const requiredPlanLabel = PLAN_TIER_LABELS[requiredPlan];

  if (variant === "inline") {
    return (
      <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border border-border">
        <Lock className="w-4 h-4 text-muted-foreground shrink-0" />
        <p className="text-xs text-muted-foreground flex-1">
          <strong>{featureName}</strong> requires the{" "}
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 mx-0.5">
            {requiredPlanLabel}
          </Badge>{" "}
          plan.
          {canUpgrade && (
            <a href="/settings" className="text-primary hover:underline ml-1 inline-flex items-center gap-0.5">
              Upgrade <ArrowUpRight className="w-3 h-3" />
            </a>
          )}
          {!canUpgrade && (
            <span className="text-muted-foreground ml-1">Ask your Owner to upgrade.</span>
          )}
        </p>
      </div>
    );
  }

  if (variant === "page") {
    const highlights = PLAN_HIGHLIGHTS[requiredPlan] || [];
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-6 max-w-md px-6">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-primary" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-foreground">{featureName}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {description || `This module is available on the ${requiredPlanLabel} plan and above.`}
            </p>
          </div>

          {/* Plan path visualization */}
          <div className="flex items-center justify-center gap-2 text-xs">
            <Badge variant="outline" className="text-[10px] px-2 py-0.5">{planDisplayName}</Badge>
            <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground" />
            <Badge className="text-[10px] px-2 py-0.5 bg-primary/10 text-primary border-primary/30">{requiredPlanLabel}</Badge>
          </div>

          {/* What you'll unlock */}
          {highlights.length > 0 && (
            <div className="bg-muted/30 rounded-lg p-4 text-left border border-border">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Included in {requiredPlanLabel}
              </p>
              <ul className="space-y-1.5">
                {highlights.map((h) => (
                  <li key={h} className="flex items-center gap-2 text-xs text-foreground">
                    <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                    {h}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex gap-2 justify-center pt-2">
            <Button variant="outline" size="sm" asChild>
              <a href="/dashboard">Back to Dashboard</a>
            </Button>
            {canUpgrade ? (
              <Button size="sm" asChild>
                <a href="/settings">
                  <Crown className="w-3.5 h-3.5 mr-1" />
                  Upgrade to {requiredPlanLabel}
                </a>
              </Button>
            ) : (
              <p className="text-xs text-muted-foreground self-center">
                Ask your organization Owner to upgrade.
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Card variant (default)
  return (
    <Card className="border-dashed border-2 border-muted-foreground/20 bg-muted/30">
      <CardContent className="flex items-center gap-4 py-5">
        <div className="p-2.5 rounded-lg bg-primary/10 shrink-0">
          <Lock className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">{featureName}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {description || `Available on the ${requiredPlanLabel} plan and above.`}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline" className="text-[10px]">Current: {planDisplayName}</Badge>
            <ArrowUpRight className="w-3 h-3 text-muted-foreground" />
            <Badge variant="secondary" className="text-[10px]">{requiredPlanLabel}</Badge>
            {canUpgrade && (
              <a
                href="/settings"
                className="text-[10px] text-primary hover:underline inline-flex items-center gap-0.5 ml-1"
              >
                Upgrade <ArrowUpRight className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
