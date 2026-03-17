
-- =============================================
-- MULTI-TENANT CORE TABLES
-- =============================================

CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  subscription_plan TEXT DEFAULT 'basic',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Main Branch',
  activity_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;

CREATE TYPE public.app_role AS ENUM ('Owner', 'Manager', 'QA', 'Staff', 'Auditor');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
  email TEXT,
  full_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- =============================================
-- HACCP DATA MODEL TABLES (from Excel)
-- =============================================

CREATE TABLE public.templates (
  id SERIAL PRIMARY KEY,
  template_name TEXT NOT NULL,
  description TEXT,
  industry_scope TEXT
);
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.activity_types (
  id SERIAL PRIMARY KEY,
  template TEXT NOT NULL,
  activity_name TEXT NOT NULL,
  industry_type TEXT
);
ALTER TABLE public.activity_types ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.process_steps (
  id SERIAL PRIMARY KEY,
  process_name TEXT NOT NULL,
  step_type TEXT,
  metadata JSONB
);
ALTER TABLE public.process_steps ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.activity_process_map (
  id SERIAL PRIMARY KEY,
  activity TEXT NOT NULL,
  process TEXT NOT NULL,
  process_order INTEGER NOT NULL
);
ALTER TABLE public.activity_process_map ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.hazard_library (
  id SERIAL PRIMARY KEY,
  hazard_name TEXT NOT NULL,
  hazard_type TEXT,
  typical_process TEXT
);
ALTER TABLE public.hazard_library ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.process_hazard_map (
  id SERIAL PRIMARY KEY,
  process TEXT NOT NULL,
  hazard TEXT NOT NULL
);
ALTER TABLE public.process_hazard_map ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.process_step_hazard_map (
  id SERIAL PRIMARY KEY,
  process_step_id INTEGER NOT NULL,
  hazard_id INTEGER NOT NULL
);
ALTER TABLE public.process_step_hazard_map ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.ccp_table (
  id SERIAL PRIMARY KEY,
  process TEXT NOT NULL,
  hazard TEXT NOT NULL,
  is_ccp BOOLEAN DEFAULT false,
  critical_limit TEXT,
  monitoring TEXT
);
ALTER TABLE public.ccp_table ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.ccp_analysis (
  id SERIAL PRIMARY KEY,
  process_step_id INTEGER NOT NULL,
  hazard_id INTEGER NOT NULL,
  severity INTEGER,
  likelihood INTEGER,
  risk_score INTEGER,
  control_type TEXT,
  critical_limit TEXT,
  monitoring TEXT,
  corrective_action TEXT
);
ALTER TABLE public.ccp_analysis ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.decision_tree_questions (
  id SERIAL PRIMARY KEY,
  activity TEXT NOT NULL,
  question TEXT NOT NULL,
  related_process TEXT
);
ALTER TABLE public.decision_tree_questions ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.logs_structure (
  id SERIAL PRIMARY KEY,
  log_name TEXT NOT NULL,
  field_name TEXT NOT NULL,
  related_process_step TEXT
);
ALTER TABLE public.logs_structure ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.logs_structure_manufacturing (
  id SERIAL PRIMARY KEY,
  log_name TEXT NOT NULL,
  process_step_id INTEGER NOT NULL,
  parameter TEXT,
  unit TEXT,
  frequency TEXT,
  record_type TEXT
);
ALTER TABLE public.logs_structure_manufacturing ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.equipment_library (
  id SERIAL PRIMARY KEY,
  equipment_name TEXT NOT NULL,
  activity_type TEXT,
  related_process TEXT
);
ALTER TABLE public.equipment_library ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.business_equipment (
  id SERIAL PRIMARY KEY,
  business_id TEXT,
  equipment_name TEXT,
  equipment_type TEXT
);
ALTER TABLE public.business_equipment ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.prp_programs (
  id SERIAL PRIMARY KEY,
  activity TEXT NOT NULL,
  program_name TEXT NOT NULL,
  description TEXT,
  frequency TEXT,
  responsible TEXT
);
ALTER TABLE public.prp_programs ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.sop_library (
  id SERIAL PRIMARY KEY,
  process_step TEXT NOT NULL,
  sop_title TEXT NOT NULL,
  procedure_text TEXT,
  responsible TEXT
);
ALTER TABLE public.sop_library ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.sop_library_manufacturing (
  id SERIAL PRIMARY KEY,
  sop_name TEXT NOT NULL,
  process_step_id INTEGER NOT NULL,
  description TEXT,
  activity_type TEXT
);
ALTER TABLE public.sop_library_manufacturing ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.document_library (
  id SERIAL PRIMARY KEY,
  document_name TEXT NOT NULL,
  description TEXT,
  responsible TEXT
);
ALTER TABLE public.document_library ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS POLICIES
-- =============================================

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

-- Reference data: read-only for authenticated users
CREATE POLICY "read_templates" ON public.templates FOR SELECT TO authenticated USING (true);
CREATE POLICY "read_activity_types" ON public.activity_types FOR SELECT TO authenticated USING (true);
CREATE POLICY "read_process_steps" ON public.process_steps FOR SELECT TO authenticated USING (true);
CREATE POLICY "read_activity_process_map" ON public.activity_process_map FOR SELECT TO authenticated USING (true);
CREATE POLICY "read_hazard_library" ON public.hazard_library FOR SELECT TO authenticated USING (true);
CREATE POLICY "read_process_hazard_map" ON public.process_hazard_map FOR SELECT TO authenticated USING (true);
CREATE POLICY "read_process_step_hazard_map" ON public.process_step_hazard_map FOR SELECT TO authenticated USING (true);
CREATE POLICY "read_ccp_table" ON public.ccp_table FOR SELECT TO authenticated USING (true);
CREATE POLICY "read_ccp_analysis" ON public.ccp_analysis FOR SELECT TO authenticated USING (true);
CREATE POLICY "read_decision_tree_questions" ON public.decision_tree_questions FOR SELECT TO authenticated USING (true);
CREATE POLICY "read_logs_structure" ON public.logs_structure FOR SELECT TO authenticated USING (true);
CREATE POLICY "read_logs_structure_manufacturing" ON public.logs_structure_manufacturing FOR SELECT TO authenticated USING (true);
CREATE POLICY "read_equipment_library" ON public.equipment_library FOR SELECT TO authenticated USING (true);
CREATE POLICY "read_business_equipment" ON public.business_equipment FOR SELECT TO authenticated USING (true);
CREATE POLICY "read_prp_programs" ON public.prp_programs FOR SELECT TO authenticated USING (true);
CREATE POLICY "read_sop_library" ON public.sop_library FOR SELECT TO authenticated USING (true);
CREATE POLICY "read_sop_library_manufacturing" ON public.sop_library_manufacturing FOR SELECT TO authenticated USING (true);
CREATE POLICY "read_document_library" ON public.document_library FOR SELECT TO authenticated USING (true);

-- Multi-tenant policies
CREATE POLICY "read_own_profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "update_own_profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "read_own_roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "read_own_org" ON public.organizations FOR SELECT TO authenticated
  USING (id IN (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()));
CREATE POLICY "read_own_branches" ON public.branches FOR SELECT TO authenticated
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()));

-- =============================================
-- TRIGGERS
-- =============================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON public.organizations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_branches_updated_at BEFORE UPDATE ON public.branches FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email) VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_organization()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.branches (organization_id, name) VALUES (NEW.id, 'Main Branch');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_organization_created AFTER INSERT ON public.organizations FOR EACH ROW EXECUTE FUNCTION public.handle_new_organization();
