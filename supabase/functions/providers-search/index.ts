import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const PRIMARY_ORIGIN = "https://repaircostmatch.com";
const ALLOWED_ORIGINS = new Set([
  PRIMARY_ORIGIN,
  "https://www.repaircostmatch.com",
  "https://martinus998.github.io",
  "http://localhost:8000",
  "http://127.0.0.1:8000",
]);
const LIVE_PAYMENT_LINK = "plink_1UFMsNBGKCKsYnS9SdXaKFIG";
const LIVE_AMOUNT = 999;
const LIVE_CURRENCY = "usd";
const MAX_PER_MINUTE = 6;
const MAX_PER_HOUR = 40;
const ALLOWED_SERVICES = new Set([
  "foundation repair",
  "basement waterproofing",
  "foundation crack repair",
  "bowing basement wall repair",
]);

function cors(origin: string | null) {
  const allowed = !!origin && ALLOWED_ORIGINS.has(origin);
  return {
    "Access-Control-Allow-Origin": allowed && origin ? origin : PRIMARY_ORIGIN,
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "content-type, authorization, apikey, x-rcm-pro-token",
    "Vary": "Origin",
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
  };
}

async function sha256(value: string) {
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("origin");
  const headers = cors(origin);
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers });
  if (req.method !== "GET") return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers });
  if (origin && !ALLOWED_ORIGINS.has(origin)) return new Response(JSON.stringify({ error: "Origin not allowed" }), { status: 403, headers });

  const token = (req.headers.get("x-rcm-pro-token") || "").trim();
  if (!/^[A-Za-z0-9_-]{40,80}$/.test(token)) return new Response(JSON.stringify({ error: "Pro access required" }), { status: 401, headers });
  const tokenHash = await sha256(token);

  const secretKeys = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") || "{}");
  const adminKey = secretKeys["default"] || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!adminKey) return new Response(JSON.stringify({ error: "Server misconfigured" }), { status: 500, headers });
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, adminKey, { auth: { persistSession: false } });

  const { data: entitlement, error: entitlementError } = await supabase
    .from("pro_entitlements")
    .select("status,payment_link_id,amount_total,currency")
    .eq("entitlement_token_hash", tokenHash)
    .maybeSingle();
  if (entitlementError) return new Response(JSON.stringify({ error: "Access check failed" }), { status: 500, headers });
  const entitled = !!entitlement && entitlement.status === "active" && entitlement.payment_link_id === LIVE_PAYMENT_LINK && entitlement.amount_total === LIVE_AMOUNT && entitlement.currency === LIVE_CURRENCY;
  if (!entitled) return new Response(JSON.stringify({ error: "Pro access required" }), { status: 403, headers });

  const now = new Date();
  const minuteAgo = new Date(now.getTime() - 60_000).toISOString();
  const hourAgo = new Date(now.getTime() - 3_600_000).toISOString();
  const [{ count: minuteCount, error: minuteError }, { count: hourCount, error: hourError }] = await Promise.all([
    supabase.from("provider_search_events").select("id", { count: "exact", head: true }).eq("entitlement_token_hash", tokenHash).gte("created_at", minuteAgo),
    supabase.from("provider_search_events").select("id", { count: "exact", head: true }).eq("entitlement_token_hash", tokenHash).gte("created_at", hourAgo),
  ]);
  if (minuteError || hourError) return new Response(JSON.stringify({ error: "Rate check failed" }), { status: 500, headers });
  if ((minuteCount || 0) >= MAX_PER_MINUTE || (hourCount || 0) >= MAX_PER_HOUR) return new Response(JSON.stringify({ error: "Too many searches. Please try again shortly." }), { status: 429, headers });

  const url = new URL(req.url);
  const zip = (url.searchParams.get("zip") || "").trim();
  const service = (url.searchParams.get("service") || "").trim().toLowerCase();
  if (!/^\d{5}$/.test(zip)) return new Response(JSON.stringify({ error: "Invalid ZIP" }), { status: 400, headers });
  if (!ALLOWED_SERVICES.has(service)) return new Response(JSON.stringify({ error: "Unsupported service" }), { status: 400, headers });

  const key = Deno.env.get("GOOGLE_PLACES_API_KEY") || Deno.env.get("GOOGLE_MAPS_API_KEY");
  if (!key) return new Response(JSON.stringify({ error: "Provider source is not configured" }), { status: 503, headers });

  const { error: logError } = await supabase.from("provider_search_events").insert({ entitlement_token_hash: tokenHash });
  if (logError) return new Response(JSON.stringify({ error: "Search audit failed" }), { status: 500, headers });

  const fieldMask = ["places.id","places.displayName","places.formattedAddress","places.rating","places.userRatingCount","places.websiteUri","places.nationalPhoneNumber","places.googleMapsUri","places.primaryTypeDisplayName"].join(",");
  const google = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Goog-Api-Key": key, "X-Goog-FieldMask": fieldMask },
    body: JSON.stringify({ textQuery: `${service} near ${zip} USA`, languageCode: "en", regionCode: "US", pageSize: 12 }),
  });
  if (!google.ok) {
    const detail = await google.text();
    console.error("Google Places error", google.status, detail.slice(0, 800));
    return new Response(JSON.stringify({ error: "Provider data source unavailable" }), { status: 502, headers });
  }

  const data = await google.json();
  const providers = Array.isArray(data.places) ? data.places.map((p: any) => ({
    id: p.id,
    placeId: p.id,
    name: p.displayName?.text || "Local provider",
    address: p.formattedAddress || "",
    rating: Number.isFinite(p.rating) ? p.rating : null,
    reviewCount: Number.isFinite(p.userRatingCount) ? p.userRatingCount : null,
    website: p.websiteUri || "",
    phone: p.nationalPhoneNumber || "",
    googleMapsUrl: p.googleMapsUri || "",
    services: [service, p.primaryTypeDisplayName?.text || ""].filter(Boolean),
    sourceLabel: "Google Places",
    license: { status: "unverified" },
  })) : [];

  return new Response(JSON.stringify({ providers, source: "Google Places", zip, service }), { status: 200, headers });
});
