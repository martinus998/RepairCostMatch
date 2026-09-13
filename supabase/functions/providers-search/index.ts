import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const SITE_ORIGIN = "https://martinus998.github.io";
const ALLOWED_SERVICES = new Set([
  "foundation repair",
  "basement waterproofing",
  "foundation crack repair",
  "bowing basement wall repair",
]);

function cors(origin: string | null) {
  const allowed = origin === SITE_ORIGIN || origin === "http://localhost:8000" || origin === "http://127.0.0.1:8000";
  return {
    "Access-Control-Allow-Origin": allowed && origin ? origin : SITE_ORIGIN,
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "content-type, authorization, apikey",
    "Vary": "Origin",
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "public, max-age=300",
  };
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("origin");
  const headers = cors(origin);
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers });
  if (req.method !== "GET") return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers });

  const key = Deno.env.get("GOOGLE_PLACES_API_KEY");
  if (!key) return new Response(JSON.stringify({ error: "Provider source is not configured" }), { status: 503, headers });

  const url = new URL(req.url);
  const zip = (url.searchParams.get("zip") || "").trim();
  const service = (url.searchParams.get("service") || "").trim().toLowerCase();
  if (!/^\d{5}$/.test(zip)) return new Response(JSON.stringify({ error: "Invalid ZIP" }), { status: 400, headers });
  if (!ALLOWED_SERVICES.has(service)) return new Response(JSON.stringify({ error: "Unsupported service" }), { status: 400, headers });

  const fieldMask = [
    "places.id",
    "places.displayName",
    "places.formattedAddress",
    "places.rating",
    "places.userRatingCount",
    "places.websiteUri",
    "places.nationalPhoneNumber",
    "places.googleMapsUri",
    "places.primaryTypeDisplayName",
  ].join(",");

  const google = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": key,
      "X-Goog-FieldMask": fieldMask,
    },
    body: JSON.stringify({
      textQuery: `${service} near ${zip} USA`,
      languageCode: "en",
      regionCode: "US",
      pageSize: 12,
    }),
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
