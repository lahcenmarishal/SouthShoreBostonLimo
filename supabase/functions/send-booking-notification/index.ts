import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const NOTIFY_TO = 'Oma.trans1@hotmail.com';
const FROM = 'Oma Trans INC <bookings@southshorebostonlimo.com>';

function fmtDate(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleString('en-US', {
      weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit', timeZone: 'America/New_York', timeZoneName: 'short',
    });
  } catch { return iso; }
}

function transferLabel(t: string) {
  if (t === 'round_trip') return 'Return (round trip)';
  if (t === 'one_way') return 'One way';
  if (t === 'hourly') return 'Hourly';
  return t || '—';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    if (!RESEND_API_KEY) throw new Error('RESEND_API_KEY not configured');
    const b = await req.json();

    const miles = Number(b.estimated_km ?? 0);
    const price = Number(b.estimated_price ?? 0);

    const rows: [string, string][] = [
      ['Customer name', b.customer_name ?? '—'],
      ['Email', b.customer_email ?? '—'],
      ['Phone', b.customer_phone ?? '—'],
      ['Pickup date & time', fmtDate(b.pickup_at)],
      ['Pickup location', b.pickup_location ?? '—'],
      ['Drop-off location', b.dropoff_location ?? '—'],
      ['Transfer type', transferLabel(b.transfer_type)],
      ['Passengers', String(b.passengers ?? '—')],
      ['Luggage', String(b.luggage ?? '—')],
      ['Extra wait (hours)', String(b.extra_wait_hours ?? 0)],
      ['Distance (miles)', `${miles} mi`],
      ['Vehicle', b.vehicle_name ?? b.vehicle_id ?? '—'],
      ['Estimated total price', `$${price.toFixed(2)}`],
      ['Notes', b.notes && String(b.notes).trim() ? b.notes : '—'],
    ];

    const esc = (v: unknown) => String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const html = `
      <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;color:#111">
        <h2 style="color:#111;margin:0 0 4px">New booking request — Oma Trans INC</h2>
        <p style="color:#666;margin:0 0 16px">South Shore Limo Boston</p>
        <table style="border-collapse:collapse;width:100%;font-size:14px">
          ${rows.map(([k, v]) => `
            <tr>
              <td style="padding:8px 12px;border:1px solid #eee;background:#fafafa;width:220px"><b>${esc(k)}</b></td>
              <td style="padding:8px 12px;border:1px solid #eee">${esc(v)}</td>
            </tr>`).join('')}
        </table>
        <p style="color:#666;font-size:12px;margin-top:16px">
          Estimated total is indicative — please confirm the final price with the customer.
        </p>
      </div>`;

    const text = rows.map(([k, v]) => `${k}: ${v}`).join('\n');

    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${RESEND_API_KEY}` },
      body: JSON.stringify({
        from: FROM,
        to: [NOTIFY_TO],
        reply_to: b.customer_email,
        subject: `New booking — ${b.customer_name ?? 'Customer'} — ${fmtDate(b.pickup_at)}`,
        html,
        text,
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
