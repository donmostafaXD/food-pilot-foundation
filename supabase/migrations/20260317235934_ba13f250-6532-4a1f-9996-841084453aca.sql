
-- Create haccp_plans table
CREATE TABLE public.haccp_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  branch_id uuid NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  business_type text NOT NULL,
  activity_name text NOT NULL,
  status text NOT NULL DEFAULT 'draft',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create haccp_plan_steps table
CREATE TABLE public.haccp_plan_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  haccp_plan_id uuid NOT NULL REFERENCES public.haccp_plans(id) ON DELETE CASCADE,
  process_name text NOT NULL,
  step_order integer NOT NULL,
  process_step_id integer
);

-- Create haccp_plan_hazards table
CREATE TABLE public.haccp_plan_hazards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  haccp_plan_step_id uuid NOT NULL REFERENCES public.haccp_plan_steps(id) ON DELETE CASCADE,
  hazard_name text NOT NULL,
  hazard_type text,
  severity integer NOT NULL DEFAULT 3,
  likelihood integer NOT NULL DEFAULT 3,
  risk_score integer NOT NULL DEFAULT 9,
  control_type text,
  critical_limit text,
  monitoring text,
  corrective_action text
);

-- Enable RLS
ALTER TABLE public.haccp_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.haccp_plan_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.haccp_plan_hazards ENABLE ROW LEVEL SECURITY;

-- RLS for haccp_plans: org-scoped
CREATE POLICY "read_own_haccp_plans" ON public.haccp_plans
  FOR SELECT TO authenticated
  USING (organization_id IN (SELECT p.organization_id FROM public.profiles p WHERE p.user_id = auth.uid()));

CREATE POLICY "insert_own_haccp_plans" ON public.haccp_plans
  FOR INSERT TO authenticated
  WITH CHECK (organization_id IN (SELECT p.organization_id FROM public.profiles p WHERE p.user_id = auth.uid()));

CREATE POLICY "update_own_haccp_plans" ON public.haccp_plans
  FOR UPDATE TO authenticated
  USING (organization_id IN (SELECT p.organization_id FROM public.profiles p WHERE p.user_id = auth.uid()));

CREATE POLICY "delete_own_haccp_plans" ON public.haccp_plans
  FOR DELETE TO authenticated
  USING (organization_id IN (SELECT p.organization_id FROM public.profiles p WHERE p.user_id = auth.uid()));

-- RLS for haccp_plan_steps: via haccp_plans join
CREATE POLICY "read_own_haccp_plan_steps" ON public.haccp_plan_steps
  FOR SELECT TO authenticated
  USING (haccp_plan_id IN (SELECT hp.id FROM public.haccp_plans hp WHERE hp.organization_id IN (SELECT p.organization_id FROM public.profiles p WHERE p.user_id = auth.uid())));

CREATE POLICY "insert_own_haccp_plan_steps" ON public.haccp_plan_steps
  FOR INSERT TO authenticated
  WITH CHECK (haccp_plan_id IN (SELECT hp.id FROM public.haccp_plans hp WHERE hp.organization_id IN (SELECT p.organization_id FROM public.profiles p WHERE p.user_id = auth.uid())));

CREATE POLICY "update_own_haccp_plan_steps" ON public.haccp_plan_steps
  FOR UPDATE TO authenticated
  USING (haccp_plan_id IN (SELECT hp.id FROM public.haccp_plans hp WHERE hp.organization_id IN (SELECT p.organization_id FROM public.profiles p WHERE p.user_id = auth.uid())));

CREATE POLICY "delete_own_haccp_plan_steps" ON public.haccp_plan_steps
  FOR DELETE TO authenticated
  USING (haccp_plan_id IN (SELECT hp.id FROM public.haccp_plans hp WHERE hp.organization_id IN (SELECT p.organization_id FROM public.profiles p WHERE p.user_id = auth.uid())));

-- RLS for haccp_plan_hazards: via haccp_plan_steps → haccp_plans join
CREATE POLICY "read_own_haccp_plan_hazards" ON public.haccp_plan_hazards
  FOR SELECT TO authenticated
  USING (haccp_plan_step_id IN (SELECT hps.id FROM public.haccp_plan_steps hps WHERE hps.haccp_plan_id IN (SELECT hp.id FROM public.haccp_plans hp WHERE hp.organization_id IN (SELECT p.organization_id FROM public.profiles p WHERE p.user_id = auth.uid()))));

CREATE POLICY "insert_own_haccp_plan_hazards" ON public.haccp_plan_hazards
  FOR INSERT TO authenticated
  WITH CHECK (haccp_plan_step_id IN (SELECT hps.id FROM public.haccp_plan_steps hps WHERE hps.haccp_plan_id IN (SELECT hp.id FROM public.haccp_plans hp WHERE hp.organization_id IN (SELECT p.organization_id FROM public.profiles p WHERE p.user_id = auth.uid()))));

CREATE POLICY "update_own_haccp_plan_hazards" ON public.haccp_plan_hazards
  FOR UPDATE TO authenticated
  USING (haccp_plan_step_id IN (SELECT hps.id FROM public.haccp_plan_steps hps WHERE hps.haccp_plan_id IN (SELECT hp.id FROM public.haccp_plans hp WHERE hp.organization_id IN (SELECT p.organization_id FROM public.profiles p WHERE p.user_id = auth.uid()))));

CREATE POLICY "delete_own_haccp_plan_hazards" ON public.haccp_plan_hazards
  FOR DELETE TO authenticated
  USING (haccp_plan_step_id IN (SELECT hps.id FROM public.haccp_plan_steps hps WHERE hps.haccp_plan_id IN (SELECT hp.id FROM public.haccp_plans hp WHERE hp.organization_id IN (SELECT p.organization_id FROM public.profiles p WHERE p.user_id = auth.uid()))));

-- Updated_at trigger for haccp_plans
CREATE TRIGGER update_haccp_plans_updated_at
  BEFORE UPDATE ON public.haccp_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
