export const NEW_OFFER = 'checkout_repair199';
export function eligibleOffer(link, amount) {
  return link === NEW_OFFER && amount === 199 || link === 'plink_1UIa4hBGKCKsYnS9JtgDtzB6' && amount === 499 || link === 'plink_1UFMsNBGKCKsYnS9SdXaKFIG' && amount === 999;
}
export async function paymentProof(sessionId, token) {
  const response=await fetch('https://bkyuyqicybqqifenhhux.supabase.co/functions/v1/repair-payments',{method:'POST',headers:{'Content-Type':'application/json','Origin':'https://repaircostmatch.com'},body:JSON.stringify({action:token?'proof':'receipt',session_id:sessionId,...(token?{token}:{})}),signal:AbortSignal.timeout(15000)});
  const data=await response.json();if(!response.ok)throw new Error('payment_verification_unavailable');return data;
}
export async function verifiedEntitlement(row) {
  if(!row||row.status!=='active'||row.currency!=='usd'||!eligibleOffer(row.payment_link_id,row.amount_total))return false;
  if(row.payment_link_id!==NEW_OFFER)return true;
  return (await paymentProof(row.stripe_checkout_session_id)).status==='paid';
}
