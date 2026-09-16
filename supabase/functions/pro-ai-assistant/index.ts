import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const PRIMARY_ORIGIN = "https://repaircostmatch.com";
const ALLOWED_ORIGINS = new Set([PRIMARY_ORIGIN,"https://www.repaircostmatch.com","https://martinus998.github.io"]);
const LIVE_PAYMENT_LINK = "plink_1UFMsNBGKCKsYnS9SdXaKFIG";
const LIVE_AMOUNT = 999;
const LIVE_CURRENCY = "usd";
const MODEL = "gpt-5.6-luna";
const HOURLY_LIMIT = 30;

function allowedOrigin(origin: string | null){return origin&&ALLOWED_ORIGINS.has(origin)?origin:PRIMARY_ORIGIN;}
function headers(origin: string | null){return {"Access-Control-Allow-Origin":allowedOrigin(origin),"Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type, x-rcm-pro-token","Access-Control-Allow-Methods":"POST, OPTIONS","Vary":"Origin","Content-Type":"application/json","Cache-Control":"no-store","X-Content-Type-Options":"nosniff"};}
function json(body:unknown,status=200,origin:string|null=null){return new Response(JSON.stringify(body),{status,headers:headers(origin)});}
async function sha256(value:string){const hash=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(value));return Array.from(new Uint8Array(hash)).map(b=>b.toString(16).padStart(2,"0")).join("");}
function cleanText(value:unknown,max=1600){return String(value??"").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g," ").trim().slice(0,max);}
function extractOutputText(data:any){if(typeof data?.output_text==="string"&&data.output_text.trim())return data.output_text.trim();const parts:string[]=[];for(const item of Array.isArray(data?.output)?data.output:[]){for(const c of Array.isArray(item?.content)?item.content:[]){if(typeof c?.text==="string")parts.push(c.text);}}return parts.join("\n").trim();}

Deno.serve(async(req:Request)=>{
  const origin=req.headers.get("origin");
  if(req.method==="OPTIONS")return new Response("ok",{headers:headers(origin)});
  if(req.method!=="POST")return json({error:"method_not_allowed"},405,origin);
  if(origin&&!ALLOWED_ORIGINS.has(origin))return json({error:"origin_not_allowed"},403,origin);

  const publishableKeys=JSON.parse(Deno.env.get("SUPABASE_PUBLISHABLE_KEYS")||"{}");
  const expectedPublicKey=publishableKeys["default"];
  if(!expectedPublicKey||req.headers.get("apikey")!==expectedPublicKey)return json({error:"unauthorized"},401,origin);

  const token=String(req.headers.get("x-rcm-pro-token")||"").trim();
  if(!/^[A-Za-z0-9_-]{40,80}$/.test(token))return json({error:"pro_required"},403,origin);
  const tokenHash=await sha256(token);

  const secretKeys=JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS")||"{}");
  const adminKey=secretKeys["default"]||Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if(!adminKey)return json({error:"server_misconfigured"},500,origin);
  const supabase=createClient(Deno.env.get("SUPABASE_URL")!,adminKey,{auth:{persistSession:false}});

  const {data:entitlement,error:entitlementError}=await supabase.from("pro_entitlements").select("status,currency,amount_total,payment_link_id").eq("entitlement_token_hash",tokenHash).maybeSingle();
  if(entitlementError)return json({error:"entitlement_lookup_failed"},500,origin);
  const valid=!!entitlement&&entitlement.status==="active"&&entitlement.payment_link_id===LIVE_PAYMENT_LINK&&entitlement.amount_total===LIVE_AMOUNT&&entitlement.currency===LIVE_CURRENCY;
  if(!valid)return json({error:"pro_required"},403,origin);

  const since=new Date(Date.now()-60*60*1000).toISOString();
  const {count}=await supabase.from("ai_assistant_events").select("id",{count:"exact",head:true}).eq("entitlement_token_hash",tokenHash).gte("created_at",since);
  if((count||0)>=HOURLY_LIMIT)return json({error:"rate_limited",message:"AI Repair Assistant hourly limit reached. Try again later."},429,origin);

  let payload:any={};try{payload=await req.json();}catch{return json({error:"invalid_json"},400,origin);}
  const question=cleanText(payload?.question,1000);if(!question)return json({error:"question_required"},400,origin);
  const context={problem:cleanText(payload?.context?.problem,120),severity:cleanText(payload?.context?.severity,80),foundation:cleanText(payload?.context?.foundation,80),zip:cleanText(payload?.context?.zip,12),screeningScore:Number(payload?.context?.screeningScore)||null,screeningLabel:cleanText(payload?.context?.screeningLabel,120),diySuitability:cleanText(payload?.context?.diySuitability,180),planningBand:cleanText(payload?.context?.planningBand,180)};

  const openaiKey=Deno.env.get("OPENAI_API_KEY");
  if(!openaiKey)return json({error:"ai_not_configured",message:"AI Repair Assistant is installed but the server AI key has not been configured yet."},503,origin);

  const instructions=`You are RepairCostMatch Pro AI Repair Assistant for U.S. homeowners. Provide concise educational home-repair planning help, not a diagnosis, inspection, engineering opinion, permit determination or contractor quote. Use the supplied repair profile as context but never pretend it proves the cause. For bowing/leaning walls, major or worsening settlement, displaced or widening structural cracks, active flooding, sewage, gas smell, fire, electrical hazards, unstable structures, excavation around foundations, structural jacking/bracing/anchoring or anything that could cause serious injury/property damage, do not provide step-by-step DIY structural repair instructions. Tell the user to stop and seek an appropriate qualified professional or emergency service. You may help document the issue and prepare questions. For lower-risk maintenance only, give conservative reversible steps, materials, tools, PPE, manufacturer-instruction reminders and clear stop conditions. Never guarantee safety, savings, outcome, price, code compliance, license status or diagnosis. If information is missing, say what needs to be checked instead of guessing. Do not advise bypassing permits, codes, safety devices, utility shutoffs or manufacturer instructions. Keep the answer practical and under about 350 words unless the user asks for more. End with a short 'Stop and call a professional if…' line whenever DIY work is discussed.`;
  const userInput=`Repair profile:\n${JSON.stringify(context,null,2)}\n\nHomeowner question:\n${question}`;

  const aiRes=await fetch("https://api.openai.com/v1/responses",{method:"POST",headers:{"Authorization":`Bearer ${openaiKey}`,"Content-Type":"application/json"},body:JSON.stringify({model:MODEL,instructions,input:userInput,max_output_tokens:900,store:false})});
  let aiData:any={};try{aiData=await aiRes.json();}catch{aiData={};}
  if(!aiRes.ok){console.error("OpenAI response error",aiRes.status,aiData?.error?.type||"unknown");return json({error:"ai_unavailable",message:"AI Repair Assistant is temporarily unavailable. Please try again."},502,origin);}
  const answer=extractOutputText(aiData);if(!answer)return json({error:"empty_ai_response"},502,origin);
  await supabase.from("ai_assistant_events").insert({entitlement_token_hash:tokenHash});
  return json({ok:true,answer},200,origin);
});
