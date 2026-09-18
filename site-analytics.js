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

  // First-party live dashboard tracking for every public RepairCostMatch page.
  if (!document.querySelector('script[data-rcm-live-tracker]')) {
    const live = document.createElement('script');
    live.src = '/repair-live-tracker.js?v=20260918-allpages1';
    live.defer = true;
    live.dataset.rcmLiveTracker = '1';
    document.head.appendChild(live);
  }
})();