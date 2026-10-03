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
const LIVE_CURRENCY = "usd";


function allowedOrigin(origin: string | null) {
  return origin && ALLOWED_ORIGINS.has(origin) ? origin : PRIMARY_ORIGIN;
}
function headers(origin: string | null) {
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
  return new Response(JSON.stringify(body), { status, headers: headers(origin) });
}
async function sha256(value: string) {
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("origin");
  if (req.method === "OPTIONS") {
    if (!origin || !ALLOWED_ORIGINS.has(origin)) return new Response(null, { status: 403 });
    return new Response("ok", { headers: headers(origin) });
  }
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405, origin);
  if (!origin || !ALLOWED_ORIGINS.has(origin)) return json({ error: "origin_not_allowed" }, 403, origin);

  const publishableKeys = JSON.parse(Deno.env.get("SUPABASE_PUBLISHABLE_KEYS") || "{}");
  const expectedPublicKey = publishableKeys["default"];
  if (!expectedPublicKey || req.headers.get("apikey") !== expectedPublicKey) return json({ error: "unauthorized" }, 401, origin);

  const contentLength = Number(req.headers.get("content-length") || "0");
  if (Number.isFinite(contentLength) && contentLength > 2048) return json({ error: "request_too_large" }, 413, origin);
  let payload: { entitlement_token?: string } = {};
  try {
    const raw = await req.text();
    if (raw.length > 2048) return json({ error: "request_too_large" }, 413, origin);
    payload = JSON.parse(raw);
  } catch { return json({ error: "invalid_json" }, 400, origin); }
  const token = String(payload.entitlement_token || "").trim();
  if (!/^[A-Za-z0-9_-]{40,80}$/.test(token)) return json({ active: false }, 200, origin);
  const tokenHash = await sha256(token);

  const secretKeys = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") || "{}");
  const adminKey = secretKeys["default"] || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!adminKey) return json({ error: "server_misconfigured" }, 500, origin);
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, adminKey, { auth: { persistSession: false } });

  const { data, error } = await supabase
    .from("pro_entitlements")
    .select("status,currency,amount_total,payment_link_id,last_verified_at,stripe_checkout_session_id")
    .eq("entitlement_token_hash", tokenHash)
    .maybeSingle();
  if (error) return json({ error: "lookup_failed" }, 500, origin);

  let valid=false;
  try { valid=await verifiedEntitlement(data); } catch { return json({error:'verification_unavailable'},503,origin); }

  if (!valid) return json({ active: false }, 200, origin);
  return json({ active: true, tier: "pro", environment: "live", ai_available: true }, 200, origin);
});
