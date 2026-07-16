const menuButton = document.querySelector(".menu-button");
const mobileMenu = document.querySelector(".mobile-menu");

function closeMenu() {
  if (!menuButton || !mobileMenu) return;
  menuButton.setAttribute("aria-expanded", "false");
  menuButton.setAttribute("aria-label", "Open menu");
  mobileMenu.classList.remove("is-open");
  document.body.classList.remove("menu-open");
}

if (menuButton && mobileMenu) {
  menuButton.addEventListener("click", () => {
    const willOpen = menuButton.getAttribute("aria-expanded") !== "true";
    menuButton.setAttribute("aria-expanded", String(willOpen));
    menuButton.setAttribute("aria-label", willOpen ? "Close menu" : "Open menu");
    mobileMenu.classList.toggle("is-open", willOpen);
    document.body.classList.toggle("menu-open", willOpen);
  });

  mobileMenu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeMenu);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMenu();
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 980) closeMenu();
  });
}

const appRail = document.querySelector(".app-rail");
const appRailCards = appRail ? Array.from(appRail.querySelectorAll(".app-rail-card")) : [];
const previousAppButton = document.querySelector("[data-app-rail-previous]");
const nextAppButton = document.querySelector("[data-app-rail-next]");
const appRailDots = Array.from(document.querySelectorAll(".app-rail-dots span"));

if (appRail && appRailCards.length > 0) {
  let activeAppIndex = 0;
  let appRailFrame;

  function closestAppIndex() {
    const railLeft = appRail.getBoundingClientRect().left;
    let closestIndex = 0;
    let closestDistance = Number.POSITIVE_INFINITY;

    appRailCards.forEach((card, index) => {
      const distance = Math.abs(card.getBoundingClientRect().left - railLeft);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });

    return closestIndex;
  }

  function updateAppRailState() {
    activeAppIndex = closestAppIndex();

    if (previousAppButton) previousAppButton.disabled = activeAppIndex === 0;
    if (nextAppButton) nextAppButton.disabled = activeAppIndex === appRailCards.length - 1;

    appRailDots.forEach((dot, index) => {
      dot.classList.toggle("is-active", index === activeAppIndex);
    });
  }

  function scrollToApp(index) {
    const targetIndex = Math.max(0, Math.min(index, appRailCards.length - 1));
    const targetCard = appRailCards[targetIndex];
    appRail.scrollTo({
      left: targetCard.offsetLeft - appRail.offsetLeft,
      behavior: "smooth"
    });
  }

  previousAppButton?.addEventListener("click", () => scrollToApp(activeAppIndex - 1));
  nextAppButton?.addEventListener("click", () => scrollToApp(activeAppIndex + 1));

  appRail.addEventListener("scroll", () => {
    window.cancelAnimationFrame(appRailFrame);
    appRailFrame = window.requestAnimationFrame(updateAppRailState);
  }, { passive: true });

  window.addEventListener("resize", updateAppRailState);
  updateAppRailState();
}

const appStoreCTAs = document.querySelectorAll("[data-app-store-cta]");

appStoreCTAs.forEach((cta) => {
  cta.addEventListener("click", () => {
    const detail = {
      cta_source: cta.dataset.ctaSource || "unknown",
      destination: "app_store",
      app_store_id: "6756965007",
      page_path: window.location.pathname
    };

    if (typeof window.gtag === "function") {
      window.gtag("event", "app_store_cta_click", detail);
    } else {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({event: "app_store_cta_click", ...detail});
    }

    window.dispatchEvent(new CustomEvent("revvradar:app-store-cta-click", {detail}));
  });
});
