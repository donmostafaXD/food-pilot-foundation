/**
 * HACCP Risk Engine
 * 
 * Centralized risk calculation and CCP/OPRP/PRP determination.
 * All HACCP logic flows through this module — no hardcoded decisions elsewhere.
 */

/** Configurable CCP threshold. Risk scores >= this value are CCPs. */
export const CCP_THRESHOLD = 12;

/** Scores >= OPRP_THRESHOLD but < CCP_THRESHOLD are OPRPs. */
export const OPRP_THRESHOLD = 8;

export type ControlType = "CCP" | "OPRP" | "PRP";

/** Calculate risk score from severity and likelihood (1–5 each). */
export const calculateRiskScore = (severity: number, likelihood: number): number => {
  return severity * likelihood;
};

/** Determine control type dynamically based on risk score. */
export const determineControlType = (riskScore: number): ControlType => {
  if (riskScore >= CCP_THRESHOLD) return "CCP";
  if (riskScore >= OPRP_THRESHOLD) return "OPRP";
  return "PRP";
};

/** Get display label and styling for a control type. */
export const getRiskDisplay = (riskScore: number, controlType?: string | null) => {
  // Use the provided control type if available, otherwise calculate
  const effective = (controlType as ControlType) || determineControlType(riskScore);

  switch (effective) {
    case "CCP":
      return {
        label: "CCP",
        controlType: "CCP" as ControlType,
        className: "bg-destructive text-destructive-foreground",
      };
    case "OPRP":
      return {
        label: "OPRP",
        controlType: "OPRP" as ControlType,
        className: "bg-warning text-warning-foreground",
      };
    default:
      return {
        label: "PRP",
        controlType: "PRP" as ControlType,
        className: "bg-muted text-muted-foreground",
      };
  }
};

export interface ResolvedControl {
  /** The final control type after safeguard logic */
  controlType: ControlType;
  /** True if the safeguard forced CCP override */
  safeguardApplied: boolean;
  /** What the pure calculation would have returned (before safeguard) */
  calculatedType: ControlType;
}

/**
 * Resolve the final control_type for a hazard.
 * 
 * Logic:
 * 1. Calculate dynamic control type from risk score.
 * 2. Apply minimum safety safeguard:
 *    - If Default_Control_Type from CCP_Table = "CCP" but calculated ≠ "CCP",
 *      force CCP to protect critical processes (e.g. Cooking, Pasteurization).
 *    - This is NOT hardcoded to process names — it relies entirely on CCP_Table data.
 * 3. PRP is a valid and explicit fallback for low-risk hazards.
 */
export const resolveControlType = (
  riskScore: number,
  defaultControlType?: string | null,
): ResolvedControl => {
  const calculated = determineControlType(riskScore);

  // Safety safeguard: if CCP_Table marks this as CCP, never downgrade
  // This protects critical processes like Cooking, Pasteurization, etc.
  // without hardcoding process names — driven entirely by CCP_Table data.
  if (defaultControlType === "CCP" && calculated !== "CCP") {
    return {
      controlType: "CCP",
      safeguardApplied: true,
      calculatedType: calculated,
    };
  }

  // OPRP safeguard: don't downgrade OPRP defaults to PRP
  if (defaultControlType === "OPRP" && calculated === "PRP") {
    return {
      controlType: "OPRP",
      safeguardApplied: true,
      calculatedType: calculated,
    };
  }

  return {
    controlType: calculated,
    safeguardApplied: false,
    calculatedType: calculated,
  };
};
