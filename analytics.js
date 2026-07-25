(() => {
  const measurementId = "G-1ST9LCB3PS";
  const consentKey = "reignvillage.analytics-consent";
  const bannerId = "analytics-consent-banner";

  const ensureStyles = () => {
    if (document.getElementById("analytics-consent-styles")) return;
    const style = document.createElement("style");
    style.id = "analytics-consent-styles";
    style.textContent = ".analytics-consent-banner{position:fixed;right:1rem;bottom:1rem;z-index:1000;max-width:32rem;padding:1rem;border:1px solid rgba(255,255,255,.2);border-radius:1rem;background:#111;color:#fff;box-shadow:0 18px 48px rgba(0,0,0,.35);font:inherit}.analytics-consent-banner p{margin:0 0 .8rem;line-height:1.45}.analytics-consent-banner div{display:flex;flex-wrap:wrap;gap:.65rem;align-items:center}.analytics-consent-banner button{min-height:44px;padding:.55rem .85rem;border:1px solid rgba(255,255,255,.35);border-radius:.5rem;background:transparent;color:inherit;font:inherit;cursor:pointer}.analytics-consent-banner button[data-analytics-consent=granted]{background:#d7ff39;color:#111;border-color:#d7ff39}.analytics-consent-banner a{color:#fff}";
    document.head.append(style);
  };

  const readConsent = () => {
    try {
      return window.localStorage.getItem(consentKey);
    } catch {
      return null;
    }
  };

  const saveConsent = (value) => {
    try {
      window.localStorage.setItem(consentKey, value);
    } catch {
      // Analytics remains optional when browser storage is unavailable.
    }
  };

  const loadAnalytics = () => {
    if (window.__reignVillageAnalyticsLoaded) return;

    window.__reignVillageAnalyticsLoaded = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function gtag() {
      window.dataLayer.push(arguments);
    };
    window.gtag("js", new Date());
    window.gtag("config", measurementId, {
      allow_google_signals: false,
      allow_ad_personalization_signals: false
    });

    const tag = document.createElement("script");
    tag.async = true;
    tag.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    document.head.append(tag);
  };

  const closeBanner = () => document.getElementById(bannerId)?.remove();

  const showBanner = () => {
    if (document.getElementById(bannerId)) return;
    ensureStyles();

    const banner = document.createElement("section");
    banner.id = bannerId;
    banner.className = "analytics-consent-banner";
    banner.setAttribute("aria-label", "Analytics preferences");
    banner.innerHTML = `
      <p>We use optional analytics to understand visits and App Store CTA use. No analytics tag loads unless you accept.</p>
      <div>
        <button type="button" data-analytics-consent="denied">Decline</button>
        <button type="button" data-analytics-consent="granted">Accept analytics</button>
        <a href="/privacy.html">Privacy policy</a>
      </div>`;

    banner.addEventListener("click", (event) => {
      const choice = event.target.closest("[data-analytics-consent]")?.dataset.analyticsConsent;
      if (!choice) return;
      saveConsent(choice);
      if (choice === "granted") loadAnalytics();
      closeBanner();
    });

    document.body.append(banner);
  };

  const initialize = () => {
    const consent = readConsent();
    if (consent === "granted") {
      loadAnalytics();
    } else if (consent !== "denied") {
      showBanner();
    }

    document.querySelectorAll("[data-analytics-preferences]").forEach((control) => {
      control.addEventListener("click", () => showBanner());
    });
  };

  window.reignVillageAnalytics = {openPreferences: showBanner};

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize, {once: true});
  } else {
    initialize();
  }
})();
