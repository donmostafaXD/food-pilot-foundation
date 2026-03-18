
CREATE TABLE public.log_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  branch_id uuid NOT NULL,
  log_name text NOT NULL,
  process_step text,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text DEFAULT 'OK',
  recorded_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.log_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "read_own_log_entries" ON public.log_entries
  FOR SELECT TO authenticated
  USING (organization_id = get_user_org_id(auth.uid()));

CREATE POLICY "insert_own_log_entries" ON public.log_entries
  FOR INSERT TO authenticated
  WITH CHECK (organization_id = get_user_org_id(auth.uid()));

CREATE POLICY "update_own_log_entries" ON public.log_entries
  FOR UPDATE TO authenticated
  USING (organization_id = get_user_org_id(auth.uid()));

CREATE POLICY "delete_own_log_entries" ON public.log_entries
  FOR DELETE TO authenticated
  USING (organization_id = get_user_org_id(auth.uid()));

CREATE INDEX idx_log_entries_org ON public.log_entries(organization_id);
CREATE INDEX idx_log_entries_branch ON public.log_entries(organization_id, branch_id);
CREATE INDEX idx_log_entries_date ON public.log_entries(created_at);
