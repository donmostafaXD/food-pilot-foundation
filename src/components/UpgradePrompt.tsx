/**
 * Reusable upgrade prompt component for locked/restricted features.
 * Shows contextual messaging about what plan is needed and why.
 */
import { Lock, ArrowUpRight, Sparkles } from "lucide-react";
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

export function UpgradePrompt({
  featureName,
  requiredPlan,
  description,
  variant = "card",
}: UpgradePromptProps) {
  const { planDisplayName } = usePlan();
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
        </p>
      </div>
    );
  }

  if (variant === "page") {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-5 max-w-md px-6">
          <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-7 h-7 text-primary" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-foreground">{featureName}</h2>
            <p className="text-sm text-muted-foreground">
              {description || `This module is available on the ${requiredPlanLabel} plan and above.`}
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <span>Your plan:</span>
            <Badge variant="outline" className="text-[10px]">{planDisplayName}</Badge>
            <span>→</span>
            <Badge variant="secondary" className="text-[10px]">{requiredPlanLabel}</Badge>
          </div>
          <div className="flex gap-2 justify-center pt-2">
            <Button variant="outline" size="sm" asChild>
              <a href="/dashboard">Back to Dashboard</a>
            </Button>
            {canUpgrade && (
              <Button size="sm" asChild>
                <a href="/settings">
                  <ArrowUpRight className="w-3.5 h-3.5 mr-1" />
                  Upgrade to {requiredPlanLabel}
                </a>
              </Button>
            )}
            {!canUpgrade && (
              <p className="text-xs text-muted-foreground">
                Ask your organization owner to upgrade.
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
          <div className="flex items-center gap-2 mt-1.5">
            <Badge variant="outline" className="text-[10px]">Current: {planDisplayName}</Badge>
            {canUpgrade && (
              <a
                href="/settings"
                className="text-[10px] text-primary hover:underline inline-flex items-center gap-0.5"
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
