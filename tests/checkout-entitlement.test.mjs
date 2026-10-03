import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {stripTypeScriptTypes} from 'node:module';
import {webcrypto} from 'node:crypto';
import {verifiedEntitlement} from '../supabase/functions/_shared/pro-offers.mjs';

function check(row, receipt='paid') {
 let handler;const fetches=[];let fields;
 const builder={select(value){fields=value.split(',');return this;},eq(){return this;},async maybeSingle(){return {error:null,data:Object.fromEntries(fields.filter(k=>k in row).map(k=>[k,row[k]]))};}};
 const admin={from:()=>builder};
 const helper=readFileSync(new URL('../supabase/functions/_shared/pro-offers.mjs',import.meta.url),'utf8').replace(/export /g,'');
 const code=stripTypeScriptTypes(readFileSync(new URL('../supabase/functions/pro-check-entitlement/index.ts',import.meta.url),'utf8').replace(/^import .*;\n/gm,''));
 const context={Request,Response,TextEncoder,AbortSignal,crypto:webcrypto,createClient:()=>admin,fetch:async(_url,opts)=>{fetches.push(JSON.parse(opts.body));return {ok:true,json:async()=>({status:receipt})};},Deno:{env:{get:k=>k==='SUPABASE_PUBLISHABLE_KEYS'?'{"default":"synthetic-public-key"}':k==='SUPABASE_SECRET_KEYS'?'{"default":"synthetic-test-only"}':'https://synthetic.invalid'},serve:f=>handler=f}};
 vm.runInNewContext(helper+'\n'+code,context);
 return {fetches,request:async()=>{const r=await handler(new Request('https://function.invalid',{method:'POST',headers:{Origin:'https://repaircostmatch.com',apikey:'synthetic-public-key','Content-Type':'application/json'},body:JSON.stringify({entitlement_token:'a'.repeat(43)})}));return {status:r.status,data:await r.json()};}};
}
const row={status:'active',currency:'usd',amount_total:199,payment_link_id:'checkout_repair199',stripe_checkout_session_id:'cs_live_syntheticReceipt12345678'};
test('new paid access sends its stored Stripe session for canonical receipt verification',async()=>{const c=check(row);const r=await c.request();assert.equal(r.status,200);assert.equal(r.data.active,true);assert.equal(r.data.ai_available,true);assert.deepEqual(c.fetches,[{action:'receipt',session_id:row.stripe_checkout_session_id}]);});
test('refunded or unpaid new receipts cannot restore Pro access',async()=>{for(const status of ['revoked','open','expired','processing'])assert.equal((await check(row,status).request()).data.active,false);});
test('wrong offer, amount or currency cannot gain paid access',async()=>{for(const x of [{...row,amount_total:198},{...row,currency:'eur'},{...row,payment_link_id:'unknown'}])assert.equal((await check(x).request()).data.active,false);});
test('legacy purchases retain their prior feature access',async()=>{for(const [id,amount,ai]of [['plink_1UIa4hBGKCKsYnS9JtgDtzB6',499,true],['plink_1UFMsNBGKCKsYnS9SdXaKFIG',999,true]]){const c=check({...row,payment_link_id:id,amount_total:amount});const r=await c.request();assert.equal(r.data.active,true);assert.equal(r.data.ai_available,ai);assert.equal(c.fetches.length,0);}});
test('an unavailable receipt service fails closed instead of accepting new paid access',async()=>{const old=global.fetch;global.fetch=async()=>{throw Error('offline');};try{await assert.rejects(()=>verifiedEntitlement(row));}finally{global.fetch=old;}});
