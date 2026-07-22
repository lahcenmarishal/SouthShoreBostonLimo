-- Site settings (singleton row)
CREATE TABLE public.site_settings (
  id boolean PRIMARY KEY DEFAULT true CHECK (id = true),
  contact_phone text,
  contact_email text,
  service_area text,
  hours text,
  address text,
  facebook_url text,
  twitter_url text,
  linkedin_url text,
  instagram_url text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.site_settings TO anon;
GRANT SELECT, INSERT, UPDATE ON public.site_settings TO authenticated;
GRANT ALL ON public.site_settings TO service_role;

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone reads site settings" ON public.site_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins insert site settings" ON public.site_settings FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update site settings" ON public.site_settings FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER site_settings_touch BEFORE UPDATE ON public.site_settings FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

INSERT INTO public.site_settings (id, contact_phone, contact_email, service_area, hours, facebook_url, twitter_url, linkedin_url, instagram_url)
VALUES (true, '+1 617 483 5676', 'info@ridechic.com', 'Boston metropolitan area and surrounding', '24 hours / 7 days', 'https://facebook.com/ridechic', 'https://x.com/ridechicaz', 'https://linkedin.com/company/ridechic', 'https://instagram.com/ridechic');

-- Storage policies for vehicle-images bucket (bucket created via tool)
CREATE POLICY "Public read vehicle images" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'vehicle-images');
CREATE POLICY "Admins upload vehicle images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'vehicle-images' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update vehicle images" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'vehicle-images' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete vehicle images" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'vehicle-images' AND public.has_role(auth.uid(), 'admin'));
