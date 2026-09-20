import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const { email, phone } = await req.json();
    const cleanEmail = String(email ?? '').trim().toLowerCase();
    const digits = String(phone ?? '').replace(/\D/g, '');
    if (!cleanEmail || digits.length < 4) {
      return new Response(JSON.stringify({ error: 'Email and phone are required.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data, error } = await admin
      .from('bookings')
      .select(
        'id,created_at,pickup_at,pickup_location,dropoff_location,transfer_type,passengers,luggage,extra_wait_hours,estimated_km,estimated_price,price_source,status,customer_name,customer_phone,vehicle_id,vehicles(name)'
      )
      .ilike('customer_email', cleanEmail)
      .order('created_at', { ascending: false })
      .limit(25);
    if (error) throw error;

    const last4 = digits.slice(-4);
    const bookings = (data ?? [])
      .filter((b) => String(b.customer_phone ?? '').replace(/\D/g, '').endsWith(last4))
      .map((b) => ({
        ...b,
        reference: String(b.id).slice(0, 8).toUpperCase(),
        vehicle_name: (b as { vehicles?: { name?: string } }).vehicles?.name ?? null,
        customer_phone: undefined,
        vehicles: undefined,
      }));

    return new Response(JSON.stringify({ bookings }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
