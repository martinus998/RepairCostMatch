import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

function hex(bytes: ArrayBuffer) {
  return Array.from(new Uint8Array(bytes)).map(b => b.toString(16).padStart(2, "0")).join("");
}
function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}
async function verifyStripeSignature(payload: string, header: string, secret: string) {
  const parts = header.split(',').map(x => x.trim());
  const t = parts.find(x => x.startsWith('t='))?.slice(2) || '';
  const signatures = parts.filter(x => x.startsWith('v1=')).map(x => x.slice(3));
  const ts = Number(t);
  if (!Number.isFinite(ts) || Math.abs(Date.now()/1000 - ts) > 300) return false;
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signed = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${t}.${payload}`));
  const expected = hex(signed);
  return signatures.some(sig => safeEqual(sig, expected));
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') return new Response('method not allowed', { status: 405 });
  const webhookSecret = Deno.env.get('STRIPE_LIVE_WEBHOOK_SECRET');
  if (!webhookSecret || !webhookSecret.startsWith('whsec_')) return new Response('not configured', { status: 503 });
  const signature = req.headers.get('stripe-signature') || '';
  const raw = await req.text();
  if (!signature || !(await verifyStripeSignature(raw, signature, webhookSecret))) return new Response('invalid signature', { status: 400 });

  let event: any;
  try { event = JSON.parse(raw); } catch { return new Response('invalid json', { status: 400 }); }
  if (event?.livemode !== true) return new Response('wrong environment', { status: 400 });

  const secretKeys = JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS') || '{}');
  const adminKey = secretKeys['default'] || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!adminKey) return new Response('server misconfigured', { status: 500 });
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, adminKey, { auth: { persistSession: false } });

  const obj = event?.data?.object || {};
  try {
    if (event.type === 'charge.refunded' && obj.payment_intent) {
      await supabase.from('pro_entitlements').update({ status: 'refunded', updated_at: new Date().toISOString() }).eq('stripe_payment_intent_id', obj.payment_intent);
    } else if (event.type === 'charge.dispute.created' && obj.payment_intent) {
      await supabase.from('pro_entitlements').update({ status: 'disputed', updated_at: new Date().toISOString() }).eq('stripe_payment_intent_id', obj.payment_intent);
    }
  } catch (err) {
    console.error('webhook update failed', err);
    return new Response('update failed', { status: 500 });
  }
  return new Response('ok', { status: 200 });
});
