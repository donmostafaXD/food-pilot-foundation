
-- Add 'demo' plan to admin_plan_definitions
INSERT INTO public.admin_plan_definitions (plan_tier, display_name, description, price, features, highlighted, visible, sort_order, max_branches, max_activities, max_users)
VALUES ('demo', 'Demo', 'Full access demo plan — all features unlocked', 0, '["All modules enabled","All features unlocked","Unlimited activities","Full PRP / SOP / Logs","Documents enabled","Audit Ready enabled","Unlimited branches","Unlimited users"]'::jsonb, false, false, 99, 999, 999, 999)
ON CONFLICT DO NOTHING;

-- Add full module access for demo plan
INSERT INTO public.admin_module_access (plan_tier, module, access) VALUES
  ('demo', 'dashboard', 'full'),
  ('demo', 'haccp_plan', 'full'),
  ('demo', 'logs', 'full'),
  ('demo', 'prp', 'full'),
  ('demo', 'sop', 'full'),
  ('demo', 'equipment', 'full'),
  ('demo', 'audit', 'full'),
  ('demo', 'documents', 'full'),
  ('demo', 'settings', 'full')
ON CONFLICT DO NOTHING;
