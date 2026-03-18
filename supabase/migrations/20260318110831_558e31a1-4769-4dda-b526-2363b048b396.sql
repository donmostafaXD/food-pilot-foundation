
CREATE TABLE public.prp_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  branch_id uuid NOT NULL,
  program_name text NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  status text NOT NULL DEFAULT 'Completed',
  notes text,
  recorded_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.prp_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "read_own_prp_records" ON public.prp_records
  FOR SELECT TO authenticated
  USING (organization_id = get_user_org_id(auth.uid()));

CREATE POLICY "insert_own_prp_records" ON public.prp_records
  FOR INSERT TO authenticated
  WITH CHECK (organization_id = get_user_org_id(auth.uid()));

CREATE POLICY "update_own_prp_records" ON public.prp_records
  FOR UPDATE TO authenticated
  USING (organization_id = get_user_org_id(auth.uid()));

CREATE POLICY "delete_own_prp_records" ON public.prp_records
  FOR DELETE TO authenticated
  USING (organization_id = get_user_org_id(auth.uid()));
