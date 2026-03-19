
-- Food safety setup customization per organization
CREATE TABLE public.food_safety_setup (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  category text NOT NULL, -- 'cleaning_chemicals', 'equipment', 'suppliers', 'storage_areas', 'waste_disposal', 'temperature_standards', 'process_notes'
  item_name text NOT NULL,
  item_value text,
  activity text, -- linked activity or NULL for all
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.food_safety_setup ENABLE ROW LEVEL SECURITY;

CREATE POLICY "read_own_food_safety_setup" ON public.food_safety_setup
  FOR SELECT TO authenticated
  USING (organization_id = get_user_org_id(auth.uid()));

CREATE POLICY "insert_own_food_safety_setup" ON public.food_safety_setup
  FOR INSERT TO authenticated
  WITH CHECK (organization_id = get_user_org_id(auth.uid()));

CREATE POLICY "update_own_food_safety_setup" ON public.food_safety_setup
  FOR UPDATE TO authenticated
  USING (organization_id = get_user_org_id(auth.uid()));

CREATE POLICY "delete_own_food_safety_setup" ON public.food_safety_setup
  FOR DELETE TO authenticated
  USING (organization_id = get_user_org_id(auth.uid()));
