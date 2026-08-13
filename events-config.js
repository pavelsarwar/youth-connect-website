// Youth Connect Foundation - Dynamic Events Configuration
// Paste the shareable Google Sheet URL below after creating the sheet.
// The sheet must be viewable by "Anyone with the link".
window.YCF_EVENTS_CONFIG = {
  sheetUrl: "https://docs.google.com/spreadsheets/d/1SGCcO7UvghLDgCbILqHxYDpMOH_cDelA4eTWhCx-3Dg/edit?usp=sharing",
  maxEvents: 4,
  showPastEvents: false
};

// Events page layout override: 3 cards per row on desktop, 2 on tablet, 1 on mobile.
(() => {
  const style = document.createElement('style');
  style.textContent = `
    .event-grid{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:20px!important;align-items:stretch!important}
    .event-card{display:flex!important;flex-direction:column!important;height:100%!important;min-width:0!important;padding:22px!important;border-radius:22px!important;background:#fff!important;border:1px solid #e5ebf3!important;box-shadow:0 12px 34px rgba(13,33,62,.065)!important;overflow:hidden!important}
    .event-date-panel{display:flex!important;align-items:center!important;gap:8px!important;min-height:0!important;padding:0!important;margin:0 0 16px!important;border:0!important;text-align:left!important}
    .event-month{min-width:auto!important;padding:7px 9px!important;border-radius:9px!important;font-size:11px!important}
    .event-day{font-size:27px!important;line-height:1!important;margin:0!important}
    .event-year{font-size:12px!important}
    .event-weekday{margin-left:auto!important;margin-top:0!important;font-size:9px!important}
    .event-body{display:flex!important;flex:1!important;flex-direction:column!important;justify-content:flex-start!important;min-width:0!important;padding:0!important}
    .event-card h3{font-size:20px!important;line-height:1.3!important;margin-bottom:13px!important}
    .event-meta{font-size:12px!important;gap:7px!important;margin-bottom:13px!important}
    .event-description{font-size:12px!important;line-height:1.6!important;padding-top:13px!important}
    .event-action{display:block!important;margin-top:auto!important;padding:17px 0 0!important}
    .event-action-icon{display:none!important}
    .event-link{width:100%!important;min-height:45px!important;margin:0!important;padding:10px 11px!important;display:flex!important;align-items:center!important;justify-content:center!important;gap:6px!important;font-size:11px!important;white-space:nowrap!important}
    .event-link span{white-space:nowrap!important}
    .empty{grid-column:1/-1!important}
    @media(max-width:980px){.event-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important}}
    @media(max-width:680px){.event-grid{grid-template-columns:1fr!important;gap:14px!important}.event-card{padding:20px!important}.event-link{font-size:11px!important;white-space:nowrap!important}}
  `;
  document.head.appendChild(style);
})();
