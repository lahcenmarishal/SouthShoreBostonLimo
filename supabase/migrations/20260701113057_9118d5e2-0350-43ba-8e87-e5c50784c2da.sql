
DROP POLICY IF EXISTS "Anyone can create booking" ON public.bookings;
DROP POLICY IF EXISTS "Auth can create booking" ON public.bookings;

CREATE POLICY "Anyone can create booking (anon)"
  ON public.bookings FOR INSERT TO anon
  WITH CHECK (user_id IS NULL);

CREATE POLICY "Anyone can create booking (auth)"
  ON public.bookings FOR INSERT TO authenticated
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());

GRANT INSERT, SELECT ON public.bookings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bookings TO authenticated;
GRANT ALL ON public.bookings TO service_role;
