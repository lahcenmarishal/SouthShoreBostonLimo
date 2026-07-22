import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const NOTIFY_TO = 'Oma.trans1@hotmail.com';
const FROM = 'South Shore Limo Boston <bookings@southshorebostonlimo.com>';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    if (!RESEND_API_KEY) throw new Error('RESEND_API_KEY not configured');
    const b = await req.json();
    const rows: [string, string][] = [
      ['Name', b.customer_name],
      ['Email', b.customer_email],
      ['Phone', b.customer_phone],
      ['Pickup at', b.pickup_at],
      ['From', b.pickup_location],
      ['To', b.dropoff_location],
      ['Transfer', b.transfer_type],
      ['Passengers', String(b.passengers)],
      ['Luggage', String(b.luggage)],
      ['Extra wait (h)', String(b.extra_wait_hours)],
      ['Estimated km', String(b.estimated_km)],
      ['Vehicle', b.vehicle_name ?? b.vehicle_id],
      ['Estimated price', `$${Number(b.estimated_price ?? 0).toFixed(2)}`],
      ['Notes', b.notes ?? ''],
    ];
    const html = `<h2>New booking request — South Shore Limo Boston</h2>
      <table style="border-collapse:collapse;font-family:Arial,sans-serif;font-size:14px">
      ${rows.map(([k, v]) => `<tr><td style="padding:6px 12px;border:1px solid #eee;background:#fafafa"><b>${k}</b></td><td style="padding:6px 12px;border:1px solid #eee">${(v ?? '').toString().replace(/</g, '&lt;')}</td></tr>`).join('')}
      </table>`;

    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${RESEND_API_KEY}` },
      body: JSON.stringify({
        from: FROM,
        to: [NOTIFY_TO],
        reply_to: b.customer_email,
        subject: `New booking — ${b.customer_name} — ${b.pickup_at}`,
        html,
      }),
    });
    if (!r.ok) {
      const t = await r.text();
      console.error('Resend error', r.status, t);
      return new Response(JSON.stringify({ error: t }), { status: r.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});