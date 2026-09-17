import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

function loadCheck(file, name, response, options = {}) {
  const source = readFileSync(new URL('../' + file, import.meta.url), 'utf8');
  const start = source.indexOf('async function ' + name + '()');
  const end = file === 'billing-live.js' ? source.indexOf('\n  function recheckWhenVisible', start) : source.indexOf('\n  if(billingTest)', start);
  assert.ok(start >= 0 && end > start);
  const saved = new Map([['receipt', 'synthetic-original']]);
  const state = {active: true, status: ''};
  const dataset = {proAccess: 'active'};
  const context = {
    payLink: {isConnected: true, remove() {this.isConnected = false;}},
    TOKEN_KEY: 'receipt', CHECK_URL: 'https://example.invalid/check', billingTest: false,
    entitlementCheckInFlight: false,
    document: {documentElement: {dataset}}, pro: {dataset: {proAccess: 'active'}},
    localStorage: {getItem: key => saved.get(key) || null, removeItem: key => saved.delete(key)},
    setStatus: text => {state.status = text;},
    markActive: () => {state.active = true; dataset.proAccess = 'active';},
    markInactive: () => {state.active = false; delete dataset.proAccess;},
    post: async () => {
      if(options.replaced) saved.set('receipt', 'synthetic-new');
      if(options.networkError) throw new Error('Network unavailable');
      return response;
    }
  };
  vm.createContext(context);
  vm.runInContext(source.slice(start, end) + '\nthis.check = ' + name, context);
  return {check: context.check, saved, state, dataset};
}

for (const [file, name] of [['billing-live.js', 'checkSaved'], ['trust-center.js', 'checkStored']]) {
  for (const status of [429, 500, 503]) {
    test(file + ' preserves paid receipt on HTTP ' + status, async () => {
      const x = loadCheck(file, name, {res: {ok: false, status}, data: {error: 'temporary'}});
      assert.equal(await x.check(), false);
      assert.equal(x.saved.get('receipt'), 'synthetic-original');
      assert.equal(x.dataset.proAccess, undefined);
      assert.match(x.state.status, /saved/i);
    });
  }
  test(file + ' preserves receipt on malformed response or offline error', async () => {
    for(const options of [{}, {networkError: true}]) {
      const x = loadCheck(file, name, {res: {ok: true}, data: {}}, options);
      assert.equal(await x.check(), false);
      assert.equal(x.saved.get('receipt'), 'synthetic-original');
      assert.equal(x.dataset.proAccess, undefined);
    }
  });
  test(file + ' removes definitively revoked access', async () => {
    const x = loadCheck(file, name, {res: {ok: true}, data: {active: false}});
    assert.equal(await x.check(), false);
    assert.equal(x.saved.has('receipt'), false);
    assert.equal(x.dataset.proAccess, undefined);
  });
  test(file + ' restores verified access without a second payment', async () => {
    const x = loadCheck(file, name, {res: {ok: true}, data: {active: true}});
    assert.equal(await x.check(), true);
    assert.equal(x.dataset.proAccess, 'active');
    assert.equal(x.saved.get('receipt'), 'synthetic-original');
  });
  test(file + ' ignores stale response after a new payment receipt', async () => {
    const x = loadCheck(file, name, {res: {ok: true}, data: {active: false}}, {replaced: true});
    await x.check();
    assert.equal(x.saved.get('receipt'), 'synthetic-new');
    assert.equal(x.dataset.proAccess, 'active');
  });
}
