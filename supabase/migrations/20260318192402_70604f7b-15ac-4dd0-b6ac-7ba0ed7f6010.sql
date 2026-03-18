
-- Custom log structures (org-scoped)
CREATE TABLE public.custom_log_structures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  branch_id uuid NOT NULL,
  log_name text NOT NULL,
  fields jsonb NOT NULL DEFAULT '[]'::jsonb,
  related_process_step text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.custom_log_structures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "read_own_custom_logs" ON public.custom_log_structures
  FOR SELECT TO authenticated
  USING (organization_id = get_user_org_id(auth.uid()));

CREATE POLICY "insert_own_custom_logs" ON public.custom_log_structures
  FOR INSERT TO authenticated
  WITH CHECK (organization_id = get_user_org_id(auth.uid()));

CREATE POLICY "update_own_custom_logs" ON public.custom_log_structures
  FOR UPDATE TO authenticated
  USING (organization_id = get_user_org_id(auth.uid()));

CREATE POLICY "delete_own_custom_logs" ON public.custom_log_structures
  FOR DELETE TO authenticated
  USING (organization_id = get_user_org_id(auth.uid()));

-- Custom PRP programs (org-scoped)
CREATE TABLE public.custom_prp_programs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  branch_id uuid NOT NULL,
  program_name text NOT NULL,
  description text,
  frequency text,
  responsible text,
  activity text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.custom_prp_programs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "read_own_custom_prp" ON public.custom_prp_programs
  FOR SELECT TO authenticated
  USING (organization_id = get_user_org_id(auth.uid()));

CREATE POLICY "insert_own_custom_prp" ON public.custom_prp_programs
  FOR INSERT TO authenticated
  WITH CHECK (organization_id = get_user_org_id(auth.uid()));

CREATE POLICY "update_own_custom_prp" ON public.custom_prp_programs
  FOR UPDATE TO authenticated
  USING (organization_id = get_user_org_id(auth.uid()));

CREATE POLICY "delete_own_custom_prp" ON public.custom_prp_programs
  FOR DELETE TO authenticated
  USING (organization_id = get_user_org_id(auth.uid()));

-- Custom SOP items (org-scoped)
CREATE TABLE public.custom_sop_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  branch_id uuid NOT NULL,
  sop_name text NOT NULL,
  process_step text NOT NULL,
  procedure_text text,
  responsible text,
  category text DEFAULT 'Custom',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.custom_sop_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "read_own_custom_sop" ON public.custom_sop_items
  FOR SELECT TO authenticated
  USING (organization_id = get_user_org_id(auth.uid()));

CREATE POLICY "insert_own_custom_sop" ON public.custom_sop_items
  FOR INSERT TO authenticated
  WITH CHECK (organization_id = get_user_org_id(auth.uid()));

CREATE POLICY "update_own_custom_sop" ON public.custom_sop_items
  FOR UPDATE TO authenticated
  USING (organization_id = get_user_org_id(auth.uid()));

CREATE POLICY "delete_own_custom_sop" ON public.custom_sop_items
  FOR DELETE TO authenticated
  USING (organization_id = get_user_org_id(auth.uid()));
