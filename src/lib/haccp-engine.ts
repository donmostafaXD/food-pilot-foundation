/**
 * HACCP Risk Engine
 * 
 * Centralized risk calculation and CCP/OPRP determination.
 * All HACCP logic flows through this module — no hardcoded decisions elsewhere.
 */

/** Configurable CCP threshold. Risk scores >= this value are CCPs. */
export const CCP_THRESHOLD = 12;

/** Scores >= OPRP_THRESHOLD but < CCP_THRESHOLD are OPRPs. */
export const OPRP_THRESHOLD = 8;

/** Calculate risk score from severity and likelihood (1–5 each). */
export const calculateRiskScore = (severity: number, likelihood: number): number => {
  return severity * likelihood;
};

/** Determine control type dynamically based on risk score. */
export const determineControlType = (riskScore: number): "CCP" | "OPRP" | "PRP" => {
  if (riskScore >= CCP_THRESHOLD) return "CCP";
  if (riskScore >= OPRP_THRESHOLD) return "OPRP";
  return "PRP";
};

/** Get display label and styling for a risk score. */
export const getRiskDisplay = (riskScore: number) => {
  const controlType = determineControlType(riskScore);

  switch (controlType) {
    case "CCP":
      return {
        label: "CCP",
        controlType,
        className: "bg-destructive text-destructive-foreground",
      };
    case "OPRP":
      return {
        label: "OPRP",
        controlType,
        className: "bg-warning text-warning-foreground",
      };
    default:
      return {
        label: "PRP",
        controlType,
        className: "bg-muted text-muted-foreground",
      };
  }
};

/**
 * Resolve the final control_type for a hazard.
 * 
 * Priority:
 * 1. If user has overridden (non-null control_type already set), keep it
 *    UNLESS the risk score has changed — then recalculate.
 * 2. Use default_control_type from CCP_Table as starting value.
 * 3. Fall back to dynamic calculation from risk score.
 */
export const resolveControlType = (
  riskScore: number,
  defaultControlType?: string | null,
): string => {
  // Dynamic calculation always wins — CCP_Table is just a starting template
  const dynamic = determineControlType(riskScore);

  // If there's a default from ccp_table but the risk score says otherwise, 
  // the dynamic calculation takes precedence
  if (defaultControlType && (defaultControlType === "CCP" || defaultControlType === "OPRP")) {
    // Only keep the default if it aligns with or is stricter than dynamic
    // e.g., default says CCP but score says OPRP → keep CCP (stricter)
    if (defaultControlType === "CCP") return "CCP";
    if (defaultControlType === "OPRP" && dynamic !== "CCP") return "OPRP";
  }

  return dynamic;
};
