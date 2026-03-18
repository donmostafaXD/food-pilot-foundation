-- Fix infinite recursion in profiles RLS
-- The org_read_profiles policy queries profiles within profiles, causing recursion

-- Create a security definer function to get org_id without triggering RLS
CREATE OR REPLACE FUNCTION public.get_user_org_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id FROM public.profiles WHERE user_id = _user_id LIMIT 1
$$;

-- Drop the recursive policy
DROP POLICY IF EXISTS org_read_profiles ON profiles;

-- Recreate using the security definer function
CREATE POLICY org_read_profiles ON profiles
  FOR SELECT TO authenticated
  USING (organization_id = public.get_user_org_id(auth.uid()));

-- Also fix user_roles org_read_roles which has the same recursion issue
DROP POLICY IF EXISTS org_read_roles ON user_roles;

CREATE POLICY org_read_roles ON user_roles
  FOR SELECT TO authenticated
  USING (user_id IN (
    SELECT p.user_id FROM profiles p
    WHERE p.organization_id = public.get_user_org_id(auth.uid())
  ));

-- Fix branches read_own_branches
DROP POLICY IF EXISTS read_own_branches ON branches;

CREATE POLICY read_own_branches ON branches
  FOR SELECT TO authenticated
  USING (organization_id = public.get_user_org_id(auth.uid()));

-- Fix branches owners_insert_branches
DROP POLICY IF EXISTS owners_insert_branches ON branches;

CREATE POLICY owners_insert_branches ON branches
  FOR INSERT TO authenticated
  WITH CHECK (organization_id = public.get_user_org_id(auth.uid()) AND has_role(auth.uid(), 'Owner'::app_role));

-- Fix branches owners_update_branches  
DROP POLICY IF EXISTS owners_update_branches ON branches;

CREATE POLICY owners_update_branches ON branches
  FOR UPDATE TO authenticated
  USING (organization_id = public.get_user_org_id(auth.uid()) AND has_role(auth.uid(), 'Owner'::app_role));

-- Fix organizations read_own_org
DROP POLICY IF EXISTS read_own_org ON organizations;

CREATE POLICY read_own_org ON organizations
  FOR SELECT TO authenticated
  USING (id = public.get_user_org_id(auth.uid()));

-- Fix haccp_plans policies
DROP POLICY IF EXISTS read_own_haccp_plans ON haccp_plans;
CREATE POLICY read_own_haccp_plans ON haccp_plans
  FOR SELECT TO authenticated
  USING (organization_id = public.get_user_org_id(auth.uid()));

DROP POLICY IF EXISTS insert_own_haccp_plans ON haccp_plans;
CREATE POLICY insert_own_haccp_plans ON haccp_plans
  FOR INSERT TO authenticated
  WITH CHECK (organization_id = public.get_user_org_id(auth.uid()));

DROP POLICY IF EXISTS update_own_haccp_plans ON haccp_plans;
CREATE POLICY update_own_haccp_plans ON haccp_plans
  FOR UPDATE TO authenticated
  USING (organization_id = public.get_user_org_id(auth.uid()));

DROP POLICY IF EXISTS delete_own_haccp_plans ON haccp_plans;
CREATE POLICY delete_own_haccp_plans ON haccp_plans
  FOR DELETE TO authenticated
  USING (organization_id = public.get_user_org_id(auth.uid()));

-- Fix haccp_plan_steps policies
DROP POLICY IF EXISTS read_own_haccp_plan_steps ON haccp_plan_steps;
CREATE POLICY read_own_haccp_plan_steps ON haccp_plan_steps
  FOR SELECT TO authenticated
  USING (haccp_plan_id IN (SELECT id FROM haccp_plans WHERE organization_id = public.get_user_org_id(auth.uid())));

DROP POLICY IF EXISTS insert_own_haccp_plan_steps ON haccp_plan_steps;
CREATE POLICY insert_own_haccp_plan_steps ON haccp_plan_steps
  FOR INSERT TO authenticated
  WITH CHECK (haccp_plan_id IN (SELECT id FROM haccp_plans WHERE organization_id = public.get_user_org_id(auth.uid())));

DROP POLICY IF EXISTS update_own_haccp_plan_steps ON haccp_plan_steps;
CREATE POLICY update_own_haccp_plan_steps ON haccp_plan_steps
  FOR UPDATE TO authenticated
  USING (haccp_plan_id IN (SELECT id FROM haccp_plans WHERE organization_id = public.get_user_org_id(auth.uid())));

DROP POLICY IF EXISTS delete_own_haccp_plan_steps ON haccp_plan_steps;
CREATE POLICY delete_own_haccp_plan_steps ON haccp_plan_steps
  FOR DELETE TO authenticated
  USING (haccp_plan_id IN (SELECT id FROM haccp_plans WHERE organization_id = public.get_user_org_id(auth.uid())));

-- Fix haccp_plan_hazards policies
DROP POLICY IF EXISTS read_own_haccp_plan_hazards ON haccp_plan_hazards;
CREATE POLICY read_own_haccp_plan_hazards ON haccp_plan_hazards
  FOR SELECT TO authenticated
  USING (haccp_plan_step_id IN (
    SELECT hps.id FROM haccp_plan_steps hps
    WHERE hps.haccp_plan_id IN (SELECT id FROM haccp_plans WHERE organization_id = public.get_user_org_id(auth.uid()))
  ));

DROP POLICY IF EXISTS insert_own_haccp_plan_hazards ON haccp_plan_hazards;
CREATE POLICY insert_own_haccp_plan_hazards ON haccp_plan_hazards
  FOR INSERT TO authenticated
  WITH CHECK (haccp_plan_step_id IN (
    SELECT hps.id FROM haccp_plan_steps hps
    WHERE hps.haccp_plan_id IN (SELECT id FROM haccp_plans WHERE organization_id = public.get_user_org_id(auth.uid()))
  ));

DROP POLICY IF EXISTS update_own_haccp_plan_hazards ON haccp_plan_hazards;
CREATE POLICY update_own_haccp_plan_hazards ON haccp_plan_hazards
  FOR UPDATE TO authenticated
  USING (haccp_plan_step_id IN (
    SELECT hps.id FROM haccp_plan_steps hps
    WHERE hps.haccp_plan_id IN (SELECT id FROM haccp_plans WHERE organization_id = public.get_user_org_id(auth.uid()))
  ));

DROP POLICY IF EXISTS delete_own_haccp_plan_hazards ON haccp_plan_hazards;
CREATE POLICY delete_own_haccp_plan_hazards ON haccp_plan_hazards
  FOR DELETE TO authenticated
  USING (haccp_plan_step_id IN (
    SELECT hps.id FROM haccp_plan_steps hps
    WHERE hps.haccp_plan_id IN (SELECT id FROM haccp_plans WHERE organization_id = public.get_user_org_id(auth.uid()))
  ));