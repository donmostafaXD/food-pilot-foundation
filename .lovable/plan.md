

# HACCP Setup Wizard & Engine — Refined Implementation Plan

## Key Data Findings

**No table renaming.** All existing table names are kept as-is:

| Excel Name (user reference) | Actual DB Table |
|---|---|
| `onboarding_questions` | `decision_tree_questions` |
| `activity_process_flow` | `activity_process_map` |
| `process_hazards_food_service` | `process_hazard_map` |
| `process_step_hazards` | `process_step_hazard_map` |
| `ccp_table_food_service` | `ccp_table` |
| `ccp_table_manufacturing` | `ccp_analysis` |

The code will map to these actual table names directly. No schema changes to existing tables.

**Business type determination:** `activity_types.template` has 3 values: "Food Service", "Manufacturing", "Bakery". Bakery uses the Food Service data path (same tables: `process_hazard_map`, `ccp_table`).

**Process Step ID resolution for manufacturing:** `activity_process_map` stores process names. For manufacturing activities, multiple `process_steps` rows can share a name (e.g., "Cooling" has IDs 8, 23, 54, 78). To resolve: join `activity_process_map.process` to `process_steps.process_name`, then filter to only those `process_step_id` values that exist in `ccp_analysis` (which has the actual hazard/CCP data for that activity's steps). This guarantees 1:1 mapping.

**Food service path:** No `process_step_id` needed. Both `process_hazard_map` and `ccp_table` use the `process` name column directly.

---

## Database Migration

Create 3 new tables (no modifications to existing tables):

**`haccp_plans`**
- `id` uuid PK, `organization_id` uuid FK→organizations, `branch_id` uuid FK→branches
- `business_type` text, `activity_name` text, `status` text default 'draft'
- `created_at`, `updated_at` timestamps
- RLS: org-scoped via `profiles.organization_id`

**`haccp_plan_steps`**
- `id` uuid PK, `haccp_plan_id` uuid FK→haccp_plans ON DELETE CASCADE
- `process_name` text, `step_order` int, `process_step_id` int (nullable — set for manufacturing, null for food service)

**`haccp_plan_hazards`**
- `id` uuid PK, `haccp_plan_step_id` uuid FK→haccp_plan_steps ON DELETE CASCADE
- `hazard_name` text, `hazard_type` text
- `severity` int default 3, `likelihood` int default 3, `risk_score` int default 9
- `control_type` text, `critical_limit` text, `monitoring` text, `corrective_action` text

RLS on all three: authenticated users can CRUD where `organization_id` matches their profile's org (via join through `haccp_plans`).

---

## Routing

Add `/setup` as a protected route in `App.tsx`. On `/dashboard`, if the user's branch has no `haccp_plans` record, redirect to `/setup`.

---

## Setup Wizard (4 Steps)

### Step 1 — Business Info
- Pre-fill business name from `organizations.name`
- Radio: Food Service / Manufacturing (derived from templates)
- Editable business name field

### Step 2 — Activity Selection
- Query `activity_types` filtered by selected business type mapping:
  - "Food Service" → template IN ('Food Service', 'Bakery')
  - "Manufacturing" → template = 'Manufacturing'
- User selects one activity

### Step 3 — Smart Questions
- Query `decision_tree_questions` WHERE `activity` = selected activity name
- Each question: YES/NO toggle
- NO → marks `related_process` for exclusion from process flow

### Step 4 — Process Flow Builder
- Query `activity_process_map` WHERE `activity` = selected activity, ORDER BY `process_order`
- Remove processes excluded by Step 3 answers
- Display ordered list with move-up/move-down/remove/add-custom-step controls
- For manufacturing: resolve `process_step_id` by joining to `process_steps` and filtering to IDs present in `ccp_analysis`

---

## HACCP Engine

After Step 4 confirmation, generate the HACCP table:

**Food Service / Bakery path:**
1. For each process step name → query `process_hazard_map` WHERE `process` = step name → get hazards
2. For control measures → query `ccp_table` WHERE `process` = step name
3. Default severity=3, likelihood=3

**Manufacturing path:**
1. For each step with `process_step_id` → query `process_step_hazard_map` WHERE `process_step_id` = id → get `hazard_id` list → query `hazard_library` for names/types
2. For control measures → query `ccp_analysis` WHERE `process_step_id` = id → get severity, likelihood, control_type, critical_limit, monitoring, corrective_action as defaults
3. Use severity/likelihood from `ccp_analysis` as defaults (not hardcoded 3/3)

**Risk classification:**
```
Risk = Severity × Likelihood
≥ 12  → CCP  (red badge)
8–11  → OPRP (no label shown)
< 8   → PRP
```

**Editable HACCP Table UI:**
Columns: Process Step | Hazard | Severity (input) | Likelihood (input) | Risk Score (auto) | Control Measure | Critical Limit | Monitoring | Corrective Action

User can: edit severity/likelihood (risk auto-recalculates), add/remove hazards per step, edit all control measure fields.

---

## Save & Dashboard

**Save:** Insert `haccp_plans` → `haccp_plan_steps` → `haccp_plan_hazards` scoped to org/branch. Redirect to dashboard.

**Dashboard:** Check for existing plan on load. If none → redirect `/setup`. If exists → show summary card with: activity name, plan status, CCP count, risk distribution (high/medium/low).

---

## Files

| Action | File |
|---|---|
| Migration | Create `haccp_plans`, `haccp_plan_steps`, `haccp_plan_hazards` with RLS |
| Create | `src/pages/SetupWizard.tsx` — multi-step wizard container |
| Create | `src/components/setup/Step1BusinessInfo.tsx` |
| Create | `src/components/setup/Step2ActivitySelection.tsx` |
| Create | `src/components/setup/Step3SmartQuestions.tsx` |
| Create | `src/components/setup/Step4ProcessFlowBuilder.tsx` |
| Create | `src/components/haccp/HACCPTable.tsx` — editable analysis table |
| Create | `src/components/haccp/HACCPSummary.tsx` — dashboard summary card |
| Modify | `src/App.tsx` — add `/setup` route |
| Modify | `src/pages/Dashboard.tsx` — plan check + redirect + summary display |

