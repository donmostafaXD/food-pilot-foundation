
-- CMS content table for admin-managed website content
CREATE TABLE public.admin_cms_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_key text NOT NULL UNIQUE,
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  visible boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_cms_content ENABLE ROW LEVEL SECURITY;

-- Everyone can read (public website needs this)
CREATE POLICY "read_cms_content" ON public.admin_cms_content
  FOR SELECT TO authenticated USING (true);

-- Allow anonymous read for public pages
CREATE POLICY "anon_read_cms_content" ON public.admin_cms_content
  FOR SELECT TO anon USING (true);

-- Super admin can manage
CREATE POLICY "super_admin_manage_cms" ON public.admin_cms_content
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- Seed default CMS content
INSERT INTO public.admin_cms_content (section_key, content, sort_order) VALUES
('hero', '{"title":"Turn Your Food Safety From Paperwork Into a","highlight":"Simple Digital System","subtitle":"Replace paper logs, automate your HACCP plan, and keep your food safety system organized, digital, and ready for inspection at any time.","cta_primary":"Get Started","cta_secondary":"Book a Demo"}'::jsonb, 1),
('trust_strip', '{"text":"No more paper logs. No more missing records. No more inspection stress."}'::jsonb, 2),
('problem', '{"title":"Food Safety Should Not Be This Hard","subtitle":"Most food businesses still rely on paper records, scattered documents, and manual HACCP systems. This leads to:","items":["Missing logs","Incomplete records","Disorganized documents","Stress during inspections"]}'::jsonb, 3),
('solution', '{"title":"A Simple Digital Food Safety System","subtitle":"Our system helps you:","items":["Automatically generate your HACCP plan","Record daily logs digitally","Manage SOPs and PRP programs","Keep all documents organized in one place","Be ready for inspection anytime"]}'::jsonb, 4),
('features', '{"title":"Everything You Need to Manage Food Safety","items":[{"title":"HACCP Plan Generator","desc":"Auto-generate your complete hazard analysis and critical control points."},{"title":"Digital Food Safety Logs","desc":"Replace paper logs with fast, organized digital records."},{"title":"SOP & PRP Management","desc":"Manage standard operating procedures and prerequisite programs."},{"title":"Inspection-Ready Reports","desc":"Print or export compliance reports instantly."},{"title":"Easy-to-Use Dashboard","desc":"See your food safety status at a glance."},{"title":"Mobile-Friendly Access","desc":"Record logs and check data from any device."}]}'::jsonb, 5),
('cta', '{"title":"Start Managing Your Food Safety the Smart Way","subtitle":"Stop managing papers. Start managing your food safety digitally.","button":"Get Started"}'::jsonb, 6),
('contact', '{"title":"Get in Touch","items":[{"label":"Name","value":"Amr Fawzi"},{"label":"Email","value":"salihamro35@gmail.com","href":"mailto:salihamro35@gmail.com"},{"label":"WhatsApp","value":"+601114742053","href":"https://wa.me/601114742053"},{"label":"Location","value":"Kuala Lumpur, Malaysia"}]}'::jsonb, 7),
('targets', '{"title":"Built for Food Businesses","items":["Restaurants","Cafés","Bakeries","Cloud Kitchens","Catering Businesses"]}'::jsonb, 8);

-- Admin UI control table for sidebar/section visibility toggles
CREATE TABLE public.admin_ui_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key text NOT NULL UNIQUE,
  config_value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_ui_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "read_ui_config" ON public.admin_ui_config
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "super_admin_manage_ui_config" ON public.admin_ui_config
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- Seed default UI config
INSERT INTO public.admin_ui_config (config_key, config_value) VALUES
('upgrade_messages', '{"default":"Upgrade your plan to access this feature.","sop":"Upgrade to Professional to access SOP Procedures.","prp":"Upgrade to Professional to access PRP Programs.","documents":"Upgrade to Premium to access full document management.","equipment":"Upgrade to Professional to access Equipment management."}'::jsonb),
('sidebar_config', '{"show_compliance_group":true,"show_operations_group":true}'::jsonb);
