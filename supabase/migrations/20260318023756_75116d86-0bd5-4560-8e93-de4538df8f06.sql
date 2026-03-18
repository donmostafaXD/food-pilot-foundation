-- Add owner reference for organization ownership metadata
ALTER TABLE public.organizations
ADD COLUMN IF NOT EXISTS owner_id uuid;

-- Make registration/onboarding idempotent and safe for first-login auto-provisioning
CREATE OR REPLACE FUNCTION public.register_organization(_org_name text, _full_name text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _user_id uuid;
  _org_id uuid;
  _branch_id uuid;
  _safe_org_name text;
  _safe_full_name text;
BEGIN
  _user_id := auth.uid();
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Ensure profile row exists for this authenticated user
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE user_id = _user_id
  ) THEN
    INSERT INTO public.profiles (user_id)
    VALUES (_user_id);
  END IF;

  -- Lock profile row to prevent duplicate org/branch creation in concurrent logins
  SELECT organization_id, branch_id
  INTO _org_id, _branch_id
  FROM public.profiles
  WHERE user_id = _user_id
  ORDER BY created_at ASC
  LIMIT 1
  FOR UPDATE;

  _safe_org_name := NULLIF(trim(_org_name), '');
  IF _safe_org_name IS NULL THEN
    _safe_org_name := 'My Organization';
  END IF;

  _safe_full_name := NULLIF(trim(_full_name), '');

  -- Create organization only once per user
  IF _org_id IS NULL THEN
    INSERT INTO public.organizations (name, owner_id)
    VALUES (_safe_org_name, _user_id)
    RETURNING id INTO _org_id;
  END IF;

  -- Create/find default branch only when missing
  IF _branch_id IS NULL THEN
    SELECT id INTO _branch_id
    FROM public.branches
    WHERE organization_id = _org_id
    ORDER BY created_at ASC
    LIMIT 1;

    IF _branch_id IS NULL THEN
      INSERT INTO public.branches (organization_id, name)
      VALUES (_org_id, 'Main Branch')
      RETURNING id INTO _branch_id;
    END IF;
  END IF;

  -- Attach org/branch to profile
  UPDATE public.profiles
  SET
    organization_id = _org_id,
    branch_id = _branch_id,
    full_name = COALESCE(_safe_full_name, full_name),
    updated_at = now()
  WHERE user_id = _user_id;

  -- Ensure owner role exists exactly once
  INSERT INTO public.user_roles (user_id, role)
  VALUES (_user_id, 'Owner')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN json_build_object(
    'organization_id', _org_id,
    'branch_id', _branch_id
  );
END;
$function$;