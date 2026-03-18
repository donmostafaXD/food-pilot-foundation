
-- 1. Rename step_type to default_step_type in process_steps
ALTER TABLE public.process_steps RENAME COLUMN step_type TO default_step_type;

-- 2. Restructure process_hazard_map: text columns → integer ID columns
DELETE FROM public.process_hazard_map;
ALTER TABLE public.process_hazard_map DROP COLUMN process;
ALTER TABLE public.process_hazard_map DROP COLUMN hazard;
ALTER TABLE public.process_hazard_map ADD COLUMN process_id integer NOT NULL DEFAULT 0;
ALTER TABLE public.process_hazard_map ADD COLUMN hazard_id integer NOT NULL DEFAULT 0;

-- 3. Clear process_step_hazard_map (keep table, remove old data)
DELETE FROM public.process_step_hazard_map;

-- 4. Restructure ccp_table: text columns → numeric IDs + new columns
DELETE FROM public.ccp_table;
ALTER TABLE public.ccp_table DROP COLUMN process;
ALTER TABLE public.ccp_table DROP COLUMN hazard;
ALTER TABLE public.ccp_table DROP COLUMN is_ccp;
ALTER TABLE public.ccp_table ADD COLUMN process_id integer NOT NULL DEFAULT 0;
ALTER TABLE public.ccp_table ADD COLUMN hazard_id integer NOT NULL DEFAULT 0;
ALTER TABLE public.ccp_table ADD COLUMN severity integer NOT NULL DEFAULT 3;
ALTER TABLE public.ccp_table ADD COLUMN likelihood integer NOT NULL DEFAULT 3;
ALTER TABLE public.ccp_table ADD COLUMN risk_score integer NOT NULL DEFAULT 9;
ALTER TABLE public.ccp_table ADD COLUMN default_control_type text;
ALTER TABLE public.ccp_table ADD COLUMN corrective_action text;
