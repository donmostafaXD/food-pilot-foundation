
-- Document lock status per org per document
CREATE TABLE public.document_lock_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  document_id integer NOT NULL,
  is_locked boolean NOT NULL DEFAULT false,
  locked_by uuid,
  locked_at timestamp with time zone,
  UNIQUE (organization_id, document_id)
);

ALTER TABLE public.document_lock_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "read_own_doc_locks" ON public.document_lock_status
  FOR SELECT TO authenticated
  USING (organization_id = get_user_org_id(auth.uid()));

CREATE POLICY "insert_own_doc_locks" ON public.document_lock_status
  FOR INSERT TO authenticated
  WITH CHECK (organization_id = get_user_org_id(auth.uid()));

CREATE POLICY "update_own_doc_locks" ON public.document_lock_status
  FOR UPDATE TO authenticated
  USING (organization_id = get_user_org_id(auth.uid()));

-- Document versions table
CREATE TABLE public.document_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  document_id integer NOT NULL,
  version_number integer NOT NULL DEFAULT 1,
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  note text
);

ALTER TABLE public.document_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "read_own_doc_versions" ON public.document_versions
  FOR SELECT TO authenticated
  USING (organization_id = get_user_org_id(auth.uid()));

CREATE POLICY "insert_own_doc_versions" ON public.document_versions
  FOR INSERT TO authenticated
  WITH CHECK (organization_id = get_user_org_id(auth.uid()));
