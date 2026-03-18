CREATE POLICY "owners_update_own_org"
ON public.organizations
FOR UPDATE
TO authenticated
USING (id = get_user_org_id(auth.uid()) AND has_role(auth.uid(), 'Owner'::app_role))
WITH CHECK (id = get_user_org_id(auth.uid()) AND has_role(auth.uid(), 'Owner'::app_role));