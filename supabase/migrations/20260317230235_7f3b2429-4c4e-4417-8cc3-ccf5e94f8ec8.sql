
-- Create registration function (security definer to bypass RLS)
CREATE OR REPLACE FUNCTION public.register_organization(
  _org_name text,
  _full_name text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id uuid;
  _org_id uuid;
  _branch_id uuid;
BEGIN
  _user_id := auth.uid();
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Create organization
  INSERT INTO organizations (name) VALUES (_org_name)
  RETURNING id INTO _org_id;

  -- Get the auto-created Main Branch
  SELECT id INTO _branch_id FROM branches WHERE organization_id = _org_id LIMIT 1;

  -- Update profile
  UPDATE profiles SET
    organization_id = _org_id,
    branch_id = _branch_id,
    full_name = _full_name
  WHERE user_id = _user_id;

  -- Assign Owner role
  INSERT INTO user_roles (user_id, role) VALUES (_user_id, 'Owner');

  RETURN json_build_object(
    'organization_id', _org_id,
    'branch_id', _branch_id
  );
END;
$$;

-- Recreate triggers (they were defined as functions but triggers may be missing)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DROP TRIGGER IF EXISTS on_organization_created ON public.organizations;
CREATE TRIGGER on_organization_created
  AFTER INSERT ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_organization();

-- Add INSERT policy on user_roles for owners to manage roles
CREATE POLICY "owners_insert_roles" ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'Owner') OR
    public.has_role(auth.uid(), 'Manager')
  );

-- Add DELETE policy on user_roles for owners
CREATE POLICY "owners_delete_roles" ON public.user_roles
  FOR DELETE TO authenticated
  USING (
    public.has_role(auth.uid(), 'Owner')
  );

-- Add UPDATE policy on user_roles for owners
CREATE POLICY "owners_update_roles" ON public.user_roles
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'Owner'))
  WITH CHECK (public.has_role(auth.uid(), 'Owner'));

-- Allow owners/managers to read all roles in their org
CREATE POLICY "org_read_roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (
    user_id IN (
      SELECT p.user_id FROM profiles p
      WHERE p.organization_id IN (
        SELECT p2.organization_id FROM profiles p2 WHERE p2.user_id = auth.uid()
      )
    )
  );

-- Allow owners/managers to read all profiles in their org
CREATE POLICY "org_read_profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (
    organization_id IN (
      SELECT p.organization_id FROM profiles p WHERE p.user_id = auth.uid()
    )
  );

-- Allow owners to insert branches
CREATE POLICY "owners_insert_branches" ON public.branches
  FOR INSERT TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT p.organization_id FROM profiles p WHERE p.user_id = auth.uid()
    ) AND (
      public.has_role(auth.uid(), 'Owner')
    )
  );

-- Allow owners to update branches
CREATE POLICY "owners_update_branches" ON public.branches
  FOR UPDATE TO authenticated
  USING (
    organization_id IN (
      SELECT p.organization_id FROM profiles p WHERE p.user_id = auth.uid()
    ) AND public.has_role(auth.uid(), 'Owner')
  );
