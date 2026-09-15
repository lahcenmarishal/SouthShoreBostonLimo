CREATE TABLE public.regions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  keywords text[] NOT NULL DEFAULT '{}',
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.regions TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.regions TO authenticated;
GRANT ALL ON public.regions TO service_role;

ALTER TABLE public.regions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone reads active regions" ON public.regions FOR SELECT TO anon USING (active = true);
CREATE POLICY "Auth reads regions" ON public.regions FOR SELECT TO authenticated USING (active = true OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins manage regions" ON public.regions FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER regions_touch BEFORE UPDATE ON public.regions FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.zone_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  pickup_region_id uuid REFERENCES public.regions(id) ON DELETE CASCADE,
  dropoff_region_id uuid REFERENCES public.regions(id) ON DELETE CASCADE,
  price numeric NOT NULL DEFAULT 0,
  round_trip_price numeric,
  bidirectional boolean NOT NULL DEFAULT false,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX zone_rates_unique_combo ON public.zone_rates (
  vehicle_id,
  COALESCE(pickup_region_id, '00000000-0000-0000-0000-000000000000'::uuid),
  COALESCE(dropoff_region_id, '00000000-0000-0000-0000-000000000000'::uuid)
);

GRANT SELECT ON public.zone_rates TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.zone_rates TO authenticated;
GRANT ALL ON public.zone_rates TO service_role;

ALTER TABLE public.zone_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone reads active zone rates" ON public.zone_rates FOR SELECT TO anon USING (active = true);
CREATE POLICY "Auth reads zone rates" ON public.zone_rates FOR SELECT TO authenticated USING (active = true OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins manage zone rates" ON public.zone_rates FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER zone_rates_touch BEFORE UPDATE ON public.zone_rates FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

ALTER TABLE public.bookings
  ADD COLUMN pickup_region_id uuid REFERENCES public.regions(id) ON DELETE SET NULL,
  ADD COLUMN dropoff_region_id uuid REFERENCES public.regions(id) ON DELETE SET NULL,
  ADD COLUMN price_source text NOT NULL DEFAULT 'formula';

INSERT INTO public.regions (name, slug, keywords, sort_order) VALUES
  ('Airport', 'airport', ARRAY['airport','logan','bos','terminal'], 1),
  ('Downtown', 'downtown', ARRAY['downtown','boston','back bay','seaport'], 2),
  ('Region A', 'region-a', ARRAY[]::text[], 3),
  ('Region B', 'region-b', ARRAY[]::text[], 4),
  ('Region C', 'region-c', ARRAY[]::text[], 5);