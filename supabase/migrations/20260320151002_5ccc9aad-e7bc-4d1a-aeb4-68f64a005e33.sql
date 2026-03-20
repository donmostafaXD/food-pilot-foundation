
-- Plan definitions (name, price, features, visibility)
CREATE TABLE public.admin_plan_definitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_tier text NOT NULL UNIQUE,
  display_name text NOT NULL,
  price numeric DEFAULT 0,
  description text,
  features jsonb DEFAULT '[]'::jsonb,
  highlighted boolean DEFAULT false,
  visible boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  max_branches integer DEFAULT 1,
  max_activities integer DEFAULT 1,
  max_users integer DEFAULT 2,
  updated_at timestamptz DEFAULT now()
);

-- Per-plan, per-module access config
CREATE TABLE public.admin_module_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_tier text NOT NULL REFERENCES public.admin_plan_definitions(plan_tier) ON DELETE CASCADE,
  module text NOT NULL,
  access text NOT NULL DEFAULT 'full',
  locked_message text,
  limited_note text,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(plan_tier, module)
);

-- RLS
ALTER TABLE public.admin_plan_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_module_access ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read
CREATE POLICY "read_plan_definitions" ON public.admin_plan_definitions
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "read_module_access" ON public.admin_module_access
  FOR SELECT TO authenticated USING (true);

-- Only super_admin can write
CREATE POLICY "super_admin_manage_plan_defs" ON public.admin_plan_definitions
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "super_admin_manage_module_access" ON public.admin_module_access
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- Seed default plan definitions
INSERT INTO public.admin_plan_definitions (plan_tier, display_name, price, description, features, highlighted, sort_order, max_branches, max_activities, max_users) VALUES
('basic', 'Basic', 29, 'Simple food safety for small businesses', '["Food Service activities", "Simplified HACCP view", "CCP / OPRP / PRP labels", "Critical limits & monitoring", "1 branch only", "1 activity only"]'::jsonb, false, 1, 1, 1, 2),
('professional', 'HACCP', 79, 'Full HACCP system with risk analysis', '["Food Service + Manufacturing", "Full risk analysis (S × L)", "Editable severity & likelihood", "Complete hazard library", "SOP & log management", "Up to 3 branches", "Multiple activities"]'::jsonb, true, 2, 3, 3, 3),
('premium', 'Compliance', 149, 'Enterprise-grade food safety & compliance', '["Everything in HACCP", "Audit tools & verification", "Compliance tracking", "Full document management", "Multi-branch support", "Advanced analytics", "Unlimited branches", "Dedicated support"]'::jsonb, false, 3, 999, 999, 999);

-- Seed default module access
INSERT INTO public.admin_module_access (plan_tier, module, access, locked_message, limited_note) VALUES
('basic', 'dashboard', 'full', NULL, NULL),
('basic', 'haccp_plan', 'limited', NULL, 'Simplified view — risk analysis hidden'),
('basic', 'logs', 'limited', NULL, '7 essential logs only'),
('basic', 'prp', 'locked', 'Available in HACCP plan and above', NULL),
('basic', 'sop', 'locked', 'Available in HACCP plan and above', NULL),
('basic', 'equipment', 'locked', 'Available in HACCP plan and above', NULL),
('basic', 'audit', 'locked', 'Available in Compliance plan', NULL),
('basic', 'documents', 'locked', 'Available in Compliance plan', NULL),
('basic', 'settings', 'full', NULL, NULL),
('professional', 'dashboard', 'full', NULL, NULL),
('professional', 'haccp_plan', 'full', NULL, NULL),
('professional', 'logs', 'full', NULL, NULL),
('professional', 'prp', 'full', NULL, NULL),
('professional', 'sop', 'full', NULL, NULL),
('professional', 'equipment', 'full', NULL, NULL),
('professional', 'audit', 'locked', 'Upgrade to Compliance for audit tools', NULL),
('professional', 'documents', 'locked', 'Upgrade to Compliance for document management', NULL),
('professional', 'settings', 'full', NULL, NULL),
('premium', 'dashboard', 'full', NULL, NULL),
('premium', 'haccp_plan', 'full', NULL, NULL),
('premium', 'logs', 'full', NULL, NULL),
('premium', 'prp', 'full', NULL, NULL),
('premium', 'sop', 'full', NULL, NULL),
('premium', 'equipment', 'full', NULL, NULL),
('premium', 'audit', 'full', NULL, NULL),
('premium', 'documents', 'full', NULL, NULL),
('premium', 'settings', 'full', NULL, NULL);
