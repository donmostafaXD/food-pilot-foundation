
-- Table for user-uploaded documents metadata
CREATE TABLE public.uploaded_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  branch_id uuid NOT NULL,
  document_name text NOT NULL,
  category text NOT NULL DEFAULT 'FSMS',
  responsible text,
  activity text,
  file_path text,
  file_type text,
  uploaded_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.uploaded_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "read_own_uploaded_docs" ON public.uploaded_documents
  FOR SELECT TO authenticated
  USING (organization_id = get_user_org_id(auth.uid()));

CREATE POLICY "insert_own_uploaded_docs" ON public.uploaded_documents
  FOR INSERT TO authenticated
  WITH CHECK (organization_id = get_user_org_id(auth.uid()));

CREATE POLICY "delete_own_uploaded_docs" ON public.uploaded_documents
  FOR DELETE TO authenticated
  USING (organization_id = get_user_org_id(auth.uid()));

CREATE POLICY "update_own_uploaded_docs" ON public.uploaded_documents
  FOR UPDATE TO authenticated
  USING (organization_id = get_user_org_id(auth.uid()));

-- Storage bucket for document uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('documents', 'documents', false, 10485760)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "auth_upload_docs" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'documents');

CREATE POLICY "auth_read_docs" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'documents');

CREATE POLICY "auth_delete_docs" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'documents');
