// Set the confirmed public support inbox before exposing an email link.
const REPAIR_SUPPORT_EMAIL = 'Martinus998@azet.sk';
(() => {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(REPAIR_SUPPORT_EMAIL)) return;
  document.querySelectorAll('[data-customer-support]').forEach(container => {
    const link = document.createElement('a');
    link.href = 'mailto:' + REPAIR_SUPPORT_EMAIL;
    link.textContent = REPAIR_SUPPORT_EMAIL;
    container.replaceChildren(document.createTextNode('For billing or Pro access help: '), link);
    container.hidden = false;
  });
})();
