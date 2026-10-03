import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {stripTypeScriptTypes} from 'node:module';
import {webcrypto} from 'node:crypto';

const paid={status:'active',currency:'usd',amount_total:199,payment_link_id:'checkout_repair199',stripe_checkout_session_id:'cs_live_syntheticPaid'};
function setup({row=paid,receipt='paid',offline=false,count=0}={}) {
 let handler; const aiCalls=[],events=[],receipts=[];
 const admin={from(table){let fields;return {select(value){fields=value.split(',');return this;},eq(){return this;},gte:async()=>({count}),maybeSingle:async()=>({error:null,data:row?Object.fromEntries(fields.filter(k=>k in row).map(k=>[k,row[k]])):null}),insert:async value=>{assert.equal(table,'ai_assistant_events');events.push(value);return {error:null};}};}};
 const helper=readFileSync(new URL('../supabase/functions/_shared/pro-offers.mjs',import.meta.url),'utf8').replace(/export /g,'');
 const source=stripTypeScriptTypes(readFileSync(new URL('../supabase/functions/pro-ai-assistant/index.ts',import.meta.url),'utf8').replace(/^import .*;\n/gm,''));
 vm.runInNewContext(helper+'\n'+source,{Request,Response,TextEncoder,AbortSignal,crypto:webcrypto,console,createClient:()=>admin,
  fetch:async(url,opts)=>{if(url==='https://api.openai.com/v1/responses'){aiCalls.push(JSON.parse(opts.body));return {ok:true,json:async()=>({output_text:'Synthetic educational answer.'})};}receipts.push(JSON.parse(opts.body));if(offline)throw Error('offline');return {ok:true,json:async()=>({status:receipt})};},
  Deno:{env:{get:k=>({SUPABASE_PUBLISHABLE_KEYS:'{"default":"synthetic-public"}',SUPABASE_SECRET_KEYS:'{"default":"synthetic-admin"}',SUPABASE_URL:'https://synthetic.invalid',OPENAI_API_KEY:'synthetic-openai'}[k])},serve:f=>handler=f}});
 return {aiCalls,events,receipts,async ask(token='a'.repeat(43)){const res=await handler(new Request('https://synthetic.invalid',{method:'POST',headers:{Origin:'https://repaircostmatch.com',apikey:'synthetic-public','x-rcm-pro-token':token},body:JSON.stringify({question:'What should I document?',context:{problem:'Small crack',zip:'10001'}})}));return {status:res.status,body:await res.json()};}};
}
test('verified $1.99 receipt permits AI with disclosed context and storage disabled',async()=>{const c=setup();const r=await c.ask();assert.equal(r.status,200);assert.equal(r.body.answer,'Synthetic educational answer.');assert.deepEqual(c.receipts,[{action:'receipt',session_id:paid.stripe_checkout_session_id}]);assert.equal(c.aiCalls.length,1);assert.equal(c.aiCalls[0].store,false);assert.match(c.aiCalls[0].input,/10001/);assert.match(c.aiCalls[0].input,/Small crack/);assert.match(c.aiCalls[0].instructions,/do NOT provide step-by-step DIY structural repair instructions/);assert.deepEqual(Object.keys(c.events[0]),['entitlement_token_hash']);});
test('unpaid, revoked, wrong-price, wrong-currency and unknown-owner access never calls AI',async()=>{for(const opts of [{row:null},{row:{...paid,status:'revoked'}},{row:{...paid,amount_total:198}},{row:{...paid,currency:'eur'}},{row:{...paid,payment_link_id:'unknown'}},...['open','expired','processing','revoked'].map(receipt=>({receipt}))]){const c=setup(opts);assert.equal((await c.ask()).status,403);assert.equal(c.aiCalls.length,0);assert.equal(c.events.length,0);}});
test('missing token and unavailable canonical verification fail closed',async()=>{const missing=setup();assert.equal((await missing.ask('')).status,403);assert.equal(missing.aiCalls.length,0);const c=setup({offline:true});assert.equal((await c.ask()).status,503);assert.equal(c.aiCalls.length,0);});
test('legacy verified Pro buyers retain AI access',async()=>{for(const [id,amount] of [['plink_1UIa4hBGKCKsYnS9JtgDtzB6',499],['plink_1UFMsNBGKCKsYnS9SdXaKFIG',999]]){const c=setup({row:{...paid,payment_link_id:id,amount_total:amount}});assert.equal((await c.ask()).status,200);assert.equal(c.aiCalls.length,1);assert.equal(c.receipts.length,0);}});
test('hourly limit denies before external AI request',async()=>{const c=setup({count:30});assert.equal((await c.ask()).status,429);assert.equal(c.aiCalls.length,0);});
