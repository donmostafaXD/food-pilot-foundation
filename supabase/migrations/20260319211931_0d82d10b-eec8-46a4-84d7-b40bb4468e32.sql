
-- PRP Master (replaces static prp_programs for dynamic loading)
CREATE TABLE IF NOT EXISTS public.prp_master (
  id serial PRIMARY KEY,
  program_name text NOT NULL,
  description text,
  frequency text,
  responsible text,
  category text DEFAULT 'Core'
);
ALTER TABLE public.prp_master ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read_prp_master" ON public.prp_master FOR SELECT TO authenticated USING (true);

-- PRP Mapping (Activity → Program)
CREATE TABLE IF NOT EXISTS public.prp_mapping (
  id serial PRIMARY KEY,
  activity text NOT NULL,
  program_name text NOT NULL
);
ALTER TABLE public.prp_mapping ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read_prp_mapping" ON public.prp_mapping FOR SELECT TO authenticated USING (true);

-- SOP Master (richer SOP library with Purpose, Scope, Procedure, Related_PRP)
CREATE TABLE IF NOT EXISTS public.sop_master (
  id serial PRIMARY KEY,
  sop_name text NOT NULL,
  process_step text NOT NULL,
  purpose text,
  scope text,
  procedure_text text,
  frequency text,
  responsible text,
  related_prp text
);
ALTER TABLE public.sop_master ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read_sop_master" ON public.sop_master FOR SELECT TO authenticated USING (true);

-- Logs Unified (replaces logs_structure with richer field metadata)
CREATE TABLE IF NOT EXISTS public.logs_unified (
  id serial PRIMARY KEY,
  log_id integer NOT NULL,
  log_name text NOT NULL,
  process_step text,
  field_name text NOT NULL,
  field_type text DEFAULT 'Text',
  parameter text,
  unit text,
  frequency text,
  required boolean DEFAULT false,
  log_category text DEFAULT 'Core',
  applicable_activities text DEFAULT 'All'
);
ALTER TABLE public.logs_unified ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read_logs_unified" ON public.logs_unified FOR SELECT TO authenticated USING (true);

-- Logs Mapping (Activity + Process_Step → Log_Name)
CREATE TABLE IF NOT EXISTS public.logs_mapping (
  id serial PRIMARY KEY,
  activity text NOT NULL,
  process_step text NOT NULL,
  log_name text NOT NULL
);
ALTER TABLE public.logs_mapping ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read_logs_mapping" ON public.logs_mapping FOR SELECT TO authenticated USING (true);

-- FSMS Documents (replaces document_library)
CREATE TABLE IF NOT EXISTS public.fsms_documents (
  id serial PRIMARY KEY,
  document_name text NOT NULL,
  description text,
  responsible text
);
ALTER TABLE public.fsms_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read_fsms_documents" ON public.fsms_documents FOR SELECT TO authenticated USING (true);
