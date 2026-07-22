import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const UA = 'SouthShoreLimoBoston/1.0 (contact@southshorebostonlimo.com)';

async function geocode(q: string): Promise<{ lat: number; lon: number } | null> {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`;
  const res = await fetch(url, { headers: { 'User-Agent': UA, 'Accept': 'application/json' } });
  if (!res.ok) return null;
  const data = await res.json();
  if (!Array.isArray(data) || data.length === 0) return null;
  return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const { pickup, dropoff } = await req.json();
    if (typeof pickup !== 'string' || typeof dropoff !== 'string' || !pickup.trim() || !dropoff.trim()) {
      return new Response(JSON.stringify({ error: 'pickup and dropoff are required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const [a, b] = await Promise.all([geocode(pickup), geocode(dropoff)]);
    if (!a || !b) {
      return new Response(JSON.stringify({ error: 'Could not locate one of the addresses' }), {
        status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const routeUrl = `https://router.project-osrm.org/route/v1/driving/${a.lon},${a.lat};${b.lon},${b.lat}?overview=false`;
    const routeRes = await fetch(routeUrl, { headers: { 'User-Agent': UA } });
    if (!routeRes.ok) {
      const body = await routeRes.text();
      return new Response(JSON.stringify({ error: 'Routing failed', details: body }), {
        status: routeRes.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const route = await routeRes.json();
    const r = route?.routes?.[0];
    if (!r) {
      return new Response(JSON.stringify({ error: 'No route found' }), {
        status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const km = Math.round((r.distance / 1000) * 10) / 10;
    const miles = Math.round((r.distance / 1609.344) * 10) / 10;
    const durationMin = Math.round(r.duration / 60);

    return new Response(JSON.stringify({ km, miles, durationMin }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});