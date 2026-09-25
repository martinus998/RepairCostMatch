// RepairCostMatch production analytics: GA4 + first-party live counters.
(() => {
  if (window.__RCM_SITE_ANALYTICS__) return;
  window.__RCM_SITE_ANALYTICS__ = true;

  const GA_ID = 'G-4XJJ4PWB79';
  const params = new URLSearchParams(location.search);
  let ownerDevice = false;

  try {
    if (params.get('owner') === '1') localStorage.setItem('rcm_owner_device', '1');
    if (params.get('owner') === '0') localStorage.removeItem('rcm_owner_device');
    ownerDevice = localStorage.getItem('rcm_owner_device') === '1';
  } catch {}

  // Keep the owner's own checks out of GA4 so traffic numbers stay useful.
  if (!ownerDevice && /^https?:$/.test(location.protocol)) {
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function(){ window.dataLayer.push(arguments); };

    window.gtag('js', new Date());
    window.gtag('config', GA_ID, {
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
      send_page_view: true
    });

    const ga = document.createElement('script');
    ga.async = true;
    ga.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(GA_ID);
    ga.referrerPolicy = 'strict-origin-when-cross-origin';
    document.head.appendChild(ga);
  }

  // Lightweight GA4 event tracking. Never sends ZIP codes, names, quote text, or other form values.
  function track(name, params = {}) {
    if (ownerDevice || typeof window.gtag !== 'function') return;
    try { window.gtag('event', name, params); } catch {}
  }
  window.rcmTrack = track;

  document.addEventListener('click', (event) => {
    const el = event.target instanceof Element ? event.target.closest('a,button') : null;
    if (!el) return;
    const href = el instanceof HTMLAnchorElement ? (el.getAttribute('href') || '') : '';

    if (el.matches('.js-start,.js-problem')) {
      track('repair_check_start', { page_path: location.pathname });
    }
    if (href.includes('buy.stripe.com') || el.matches('.pro-live-pay')) {
      track('begin_checkout', {
        currency: 'USD',
        value: 4.99,
        items: [{ item_name: 'RepairCostMatch Pro', price: 4.99, quantity: 1 }]
      });
    }
    if (el.closest('.provider-card') && (href.startsWith('http') || href.startsWith('tel:'))) {
      track('provider_outbound', {
        destination_type: href.startsWith('tel:') ? 'phone' : 'website',
        page_path: location.pathname
      });
    }
  }, true);

  const markPlannerComplete = () => {
    const result = document.getElementById('resultBand');
    if (!result || !result.textContent || result.textContent.trim() === '—') return;
    try {
      if (sessionStorage.getItem('rcm.ga.repair_complete') === '1') return;
      sessionStorage.setItem('rcm.ga.repair_complete', '1');
    } catch {}
    track('repair_check_complete', { page_path: location.pathname });
  };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      const result = document.getElementById('resultBand');
      if (result) new MutationObserver(markPlannerComplete).observe(result, {childList:true,characterData:true,subtree:true});
    }, {once:true});
  } else {
    const result = document.getElementById('resultBand');
    if (result) new MutationObserver(markPlannerComplete).observe(result, {childList:true,characterData:true,subtree:true});
  }

  window.addEventListener('rcm:purchase-verified', () => {
    try {
      if (sessionStorage.getItem('rcm.ga.purchase_sent') === '1') return;
      sessionStorage.setItem('rcm.ga.purchase_sent', '1');
    } catch {}
    track('purchase', {
      currency: 'USD',
      value: 4.99,
      items: [{ item_name: 'RepairCostMatch Pro', price: 4.99, quantity: 1 }]
    });
  });

  // First-party live dashboard tracking for every public RepairCostMatch page.
  if (!document.querySelector('script[data-rcm-live-tracker]')) {
    const live = document.createElement('script');
    live.src = '/repair-live-tracker.js?v=20260918-allpages1';
    live.defer = true;
    live.dataset.rcmLiveTracker = '1';
    document.head.appendChild(live);
  }
})();

// Independent presentation module, including for owner devices.
// Google Pay is not advertised until enabled on this site's own Stripe account.
(() => {
  if (document.querySelector('script[data-fast-checkout-labels]')) return;
  const wallets = document.createElement('script');
  wallets.src = '/fast-checkout-labels.js?v=20260925-wallets1';
  wallets.dataset.fastCheckoutLabels = '1';
  document.head.append(wallets);
})();
