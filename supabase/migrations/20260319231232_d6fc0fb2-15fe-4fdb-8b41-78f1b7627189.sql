
CREATE TABLE public.document_custom_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  document_id integer NOT NULL,
  section_key text NOT NULL,
  content text,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (organization_id, document_id, section_key)
);

ALTER TABLE public.document_custom_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "read_own_doc_content" ON public.document_custom_content
  FOR SELECT TO authenticated
  USING (organization_id = get_user_org_id(auth.uid()));

CREATE POLICY "insert_own_doc_content" ON public.document_custom_content
  FOR INSERT TO authenticated
  WITH CHECK (organization_id = get_user_org_id(auth.uid()));

CREATE POLICY "update_own_doc_content" ON public.document_custom_content
  FOR UPDATE TO authenticated
  USING (organization_id = get_user_org_id(auth.uid()));

CREATE POLICY "delete_own_doc_content" ON public.document_custom_content
  FOR DELETE TO authenticated
  USING (organization_id = get_user_org_id(auth.uid()));
