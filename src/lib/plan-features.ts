/**
 * Plan Feature Map — Single source of truth for plan-based feature gating.
 *
 * Defines what each plan includes, what's locked, and upgrade messaging.
 * This does NOT change any core business logic or data models.
 */

import type { PlanTier } from "@/hooks/usePlan";

export type PlanModule =
  | "dashboard"
  | "haccp_plan"
  | "logs"
  | "prp"
  | "sop"
  | "equipment"
  | "audit"
  | "documents"
  | "settings";

export type PlanModuleAccess = "full" | "limited" | "locked" | "hidden";

export interface PlanModuleConfig {
  access: PlanModuleAccess;
  /** Short label shown in sidebar / locked state */
  label: string;
  /** Minimum plan required for full access */
  requiredPlan: PlanTier;
  /** Message shown when locked */
  lockedMessage?: string;
  /** Description of what's limited (for "limited" access) */
  limitedNote?: string;
}

// ── Plan Feature Matrix ──────────────────────────────────────────────
const PLAN_FEATURES: Partial<Record<PlanTier, Record<PlanModule, PlanModuleConfig>>> = {
  basic: {
    dashboard:   { access: "full",    label: "Dashboard",      requiredPlan: "basic" },
    haccp_plan:  { access: "limited", label: "HACCP Plan",     requiredPlan: "basic",        limitedNote: "Simplified view — risk analysis hidden" },
    logs:        { access: "limited", label: "Logs",           requiredPlan: "basic",        limitedNote: "7 essential logs only" },
    prp:         { access: "locked",  label: "PRP Programs",   requiredPlan: "professional", lockedMessage: "Available in HACCP plan and above" },
    sop:         { access: "locked",  label: "SOP Procedures", requiredPlan: "professional", lockedMessage: "Available in HACCP plan and above" },
    equipment:   { access: "locked",  label: "Equipment",      requiredPlan: "professional", lockedMessage: "Available in HACCP plan and above" },
    audit:       { access: "locked",  label: "Audit Ready",    requiredPlan: "premium",      lockedMessage: "Available in Compliance plan" },
    documents:   { access: "locked",  label: "Documents",      requiredPlan: "premium",      lockedMessage: "Available in Compliance plan" },
    settings:    { access: "full",    label: "Settings",       requiredPlan: "basic" },
  },
  professional: {
    dashboard:   { access: "full",    label: "Dashboard",      requiredPlan: "basic" },
    haccp_plan:  { access: "full",    label: "HACCP Plan",     requiredPlan: "basic" },
    logs:        { access: "full",    label: "Logs",           requiredPlan: "basic" },
    prp:         { access: "full",    label: "PRP Programs",   requiredPlan: "professional" },
    sop:         { access: "full",    label: "SOP Procedures", requiredPlan: "professional" },
    equipment:   { access: "full",    label: "Equipment",      requiredPlan: "professional" },
    audit:       { access: "locked",  label: "Audit Ready",    requiredPlan: "premium",      lockedMessage: "Upgrade to Compliance for audit tools" },
    documents:   { access: "locked",  label: "Documents",      requiredPlan: "premium",      lockedMessage: "Upgrade to Compliance for document management" },
    settings:    { access: "full",    label: "Settings",       requiredPlan: "basic" },
  },
  premium: {
    dashboard:   { access: "full",    label: "Dashboard",      requiredPlan: "basic" },
    haccp_plan:  { access: "full",    label: "HACCP Plan",     requiredPlan: "basic" },
    logs:        { access: "full",    label: "Logs",           requiredPlan: "basic" },
    prp:         { access: "full",    label: "PRP Programs",   requiredPlan: "professional" },
    sop:         { access: "full",    label: "SOP Procedures", requiredPlan: "professional" },
    equipment:   { access: "full",    label: "Equipment",      requiredPlan: "professional" },
    audit:       { access: "full",    label: "Audit Ready",    requiredPlan: "premium" },
    documents:   { access: "full",    label: "Documents",      requiredPlan: "premium" },
    settings:    { access: "full",    label: "Settings",       requiredPlan: "basic" },
  },
  demo: {
    dashboard:   { access: "full",    label: "Dashboard",      requiredPlan: "basic" },
    haccp_plan:  { access: "full",    label: "HACCP Plan",     requiredPlan: "basic" },
    logs:        { access: "full",    label: "Logs",           requiredPlan: "basic" },
    prp:         { access: "full",    label: "PRP Programs",   requiredPlan: "basic" },
    sop:         { access: "full",    label: "SOP Procedures", requiredPlan: "basic" },
    equipment:   { access: "full",    label: "Equipment",      requiredPlan: "basic" },
    audit:       { access: "full",    label: "Audit Ready",    requiredPlan: "basic" },
    documents:   { access: "full",    label: "Documents",      requiredPlan: "basic" },
    settings:    { access: "full",    label: "Settings",       requiredPlan: "basic" },
  },
};

// ── Public API ───────────────────────────────────────────────────────

export function getModuleAccess(plan: PlanTier, module: PlanModule): PlanModuleConfig {
  return PLAN_FEATURES[plan]?.[module] ?? {
    access: "full",
    label: module,
    requiredPlan: "basic",
  };
}

export function isModuleLocked(plan: PlanTier, module: PlanModule): boolean {
  return getModuleAccess(plan, module).access === "locked";
}

export function isModuleLimited(plan: PlanTier, module: PlanModule): boolean {
  return getModuleAccess(plan, module).access === "limited";
}

export function getUpgradeMessage(plan: PlanTier, module: PlanModule): string {
  const config = getModuleAccess(plan, module);
  if (config.lockedMessage) return config.lockedMessage;
  return `Upgrade to ${PLAN_TIER_LABELS[config.requiredPlan]} to access ${config.label}`;
}

/** Get all modules and their access status for a given plan */
export function getPlanModuleMap(plan: PlanTier): Record<PlanModule, PlanModuleConfig> {
  return PLAN_FEATURES[plan];
}

/** Human-readable plan tier labels */
export const PLAN_TIER_LABELS: Record<PlanTier, string> = {
  basic: "Basic",
  professional: "HACCP",
  premium: "Compliance",
};

/** Plan comparison data for upgrade prompts */
export const PLAN_COMPARISON = [
  { module: "Dashboard",      basic: "✓", haccp: "✓", compliance: "✓" },
  { module: "HACCP Plan",     basic: "Simplified", haccp: "Full Risk Analysis", compliance: "Full Risk Analysis" },
  { module: "Logs",           basic: "7 Essential", haccp: "All Logs", compliance: "All Logs" },
  { module: "PRP Programs",   basic: "—", haccp: "✓", compliance: "✓" },
  { module: "SOP Procedures", basic: "—", haccp: "✓", compliance: "✓" },
  { module: "Equipment",      basic: "—", haccp: "✓", compliance: "✓" },
  { module: "Audit Ready",    basic: "—", haccp: "—", compliance: "✓" },
  { module: "Documents",      basic: "—", haccp: "—", compliance: "✓" },
  { module: "Branches",       basic: "1", haccp: "Up to 3", compliance: "Unlimited" },
  { module: "Activities",     basic: "1", haccp: "Up to 3", compliance: "Unlimited" },
  { module: "Users",          basic: "2", haccp: "3", compliance: "Unlimited" },
] as const;
