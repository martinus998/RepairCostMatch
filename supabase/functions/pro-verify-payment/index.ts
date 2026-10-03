import {eligibleOffer, verifiedEntitlement, paymentProof, NEW_OFFER} from "../_shared/pro-offers.mjs";
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const PRIMARY_ORIGIN = "https://repaircostmatch.com";
const ALLOWED_ORIGINS = new Set([
  PRIMARY_ORIGIN,
  "https://www.repaircostmatch.com",
  "https://martinus998.github.io",
]);
const PRIMARY_PAYMENT_LINK = "plink_1UIa4hBGKCKsYnS9JtgDtzB6";
const PRIMARY_AMOUNT = 499;
const LEGACY_PAYMENT_LINK = "plink_1UFMsNBGKCKsYnS9SdXaKFIG";
const LEGACY_AMOUNT = 999;
const EXPECTED_CURRENCY = "usd";


function allowedOrigin(origin: string | null) {
  return origin && ALLOWED_ORIGINS.has(origin) ? origin : PRIMARY_ORIGIN;
}
function cors(origin: string | null) {
  return {
    "Access-Control-Allow-Origin": allowedOrigin(origin),
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
  };
}
function json(body: unknown, status = 200, origin: string | null = null) {
  return new Response(JSON.stringify(body), { status, headers: cors(origin) });
}
function b64url(bytes: Uint8Array) {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
async function sha256(value: string) {
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("origin");
  if (req.method === "OPTIONS") {
    if (!origin || !ALLOWED_ORIGINS.has(origin)) return new Response(null, { status: 403 });
    return new Response("ok", { headers: cors(origin) });
  }
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405, origin);
  if (!origin || !ALLOWED_ORIGINS.has(origin)) return json({ error: "origin_not_allowed" }, 403, origin);

  const publishableKeys = JSON.parse(Deno.env.get("SUPABASE_PUBLISHABLE_KEYS") || "{}");
  const expectedPublicKey = publishableKeys["default"];
  const suppliedKey = req.headers.get("apikey");
  if (!expectedPublicKey || !suppliedKey || suppliedKey !== expectedPublicKey) return json({ error: "unauthorized" }, 401, origin);

  const contentLength = Number(req.headers.get("content-length") || "0");
  if (Number.isFinite(contentLength) && contentLength > 2048) return json({ error: "request_too_large" }, 413, origin);
  let payload: { session_id?: string; order_token?: string } = {};
  try {
    const raw = await req.text();
    if (raw.length > 2048) return json({ error: "request_too_large" }, 413, origin);
    payload = JSON.parse(raw);
  } catch { return json({ error: "invalid_json" }, 400, origin); }
  const sessionId = String(payload.session_id || "").trim();
  if (!/^cs_live_[A-Za-z0-9_]+$/.test(sessionId)) return json({ error: "invalid_session" }, 400, origin);

  let session:any;
  if(payload.order_token) {
    if(!/^[a-f0-9]{64}$/.test(payload.order_token))return json({error:'invalid_access'},403,origin);
    try {
      const proof=await paymentProof(sessionId,payload.order_token);
      if(!proof.ok||proof.status!=='paid'||proof.session_id!==sessionId||proof.amount!==199||proof.currency!=='usd'||proof.offer_marker!==NEW_OFFER)return json({error:'payment_not_eligible'},403,origin);
      session={id:sessionId,livemode:true,status:'complete',payment_status:'paid',mode:'payment',payment_link:NEW_OFFER,amount_total:199,currency:'usd',payment_intent:proof.payment_intent};
    } catch {return json({error:'payment_verification_unavailable'},503,origin);}
  } else {
    const stripeSecret=Deno.env.get('STRIPE_LIVE_RESTRICTED_KEY');
    if(!stripeSecret?.startsWith('rk_live_'))return json({error:'billing_not_configured'},503,origin);
    const stripeRes=await fetch(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`,{headers:{Authorization:`Bearer ${stripeSecret}`},signal:AbortSignal.timeout(10000)});
    if(!stripeRes.ok)return json({error:'stripe_verification_failed'},400,origin);
    session=await stripeRes.json();
  }

  const valid = session?.livemode === true &&
    session?.status === "complete" &&
    session?.payment_status === "paid" &&
    session?.mode === "payment" &&
    eligibleOffer(session?.payment_link, session?.amount_total) &&
    session?.currency === EXPECTED_CURRENCY;
  if (!valid) return json({ error: "payment_not_eligible" }, 403, origin);

  const secretKeys = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") || "{}");
  const adminKey = secretKeys["default"] || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!adminKey) return json({ error: "server_misconfigured" }, 500, origin);
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, adminKey, { auth: { persistSession: false } });

  const { data: existing, error: existingError } = await supabase
    .from("pro_entitlements")
    .select("status,payment_link_id,amount_total,currency,stripe_checkout_session_id,entitlement_token_hash")
    .eq("stripe_checkout_session_id", sessionId)
    .maybeSingle();
  if (existingError) return json({ error: "entitlement_lookup_failed" }, 500, origin);
  const ownerReceipt=payload.order_token?b64url(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode('rcm-receipt:'+sessionId+':'+payload.order_token)))):null;
  if (existing) {
    const stillActive = existing.status === "active" &&
      eligibleOffer(existing.payment_link_id, existing.amount_total) &&
      existing.currency === EXPECTED_CURRENCY;
    if(stillActive&&ownerReceipt&&existing.entitlement_token_hash===await sha256(ownerReceipt))return json({ok:true,entitlement_token:ownerReceipt,tier:'pro',environment:'live'},200,origin);
    return stillActive
      ? json({ error: "already_verified", active: true }, 409, origin)
      : json({ error: "payment_not_eligible" }, 403, origin);
  }

  const token = ownerReceipt || b64url(crypto.getRandomValues(new Uint8Array(32)));
  const tokenHash = await sha256(token);
  const email = String(session?.customer_details?.email || "").trim().toLowerCase();
  const emailHash = email ? await sha256(email) : null;

  const row = {
    stripe_checkout_session_id: sessionId,
    stripe_payment_intent_id: typeof session?.payment_intent === "string" ? session.payment_intent : null,
    payment_link_id: session.payment_link,
    entitlement_token_hash: tokenHash,
    email_hash: emailHash,
    amount_total: session.amount_total,
    currency: session.currency,
    status: "active",
    last_verified_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  const { error } = await supabase.from("pro_entitlements").insert(row);
  if (error) {
    if (error.code === "23505") return json({ error: "already_verified" }, 409, origin);
    return json({ error: "entitlement_write_failed" }, 500, origin);
  }

  return json({ ok: true, entitlement_token: token, tier: "pro", environment: "live" }, 200, origin);
});

