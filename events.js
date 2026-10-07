(() => {
  const notify = (name, properties) => {
    let consent;
    try {
      consent = localStorage.getItem("reignvillage.analytics-consent");
    } catch {
      return;
    }
    if (consent === "granted" && typeof window.gtag === "function")
      window.gtag("event", name, properties);
  };
  document
    .querySelectorAll("[data-event-link],[data-open-app]")
    .forEach((link) =>
      link.addEventListener("click", () =>
        notify(
          link.hasAttribute("data-open-app")
            ? "event_open_app"
            : "event_detail_open",
          { event_id: link.dataset.eventId },
        ),
      ),
    );
  const copy = document.querySelector("[data-copy-link]");
  if (copy && navigator.clipboard) {
    copy.hidden = false;
    copy.addEventListener("click", async () => {
      const status = document.querySelector(".event-copy-status");
      try {
        await navigator.clipboard.writeText(copy.dataset.copyLink);
        status.textContent = "Event link copied.";
      } catch {
        status.textContent =
          "Couldn’t copy the link. You can copy the address from your browser.";
      }
    });
  }
  const marker = document.querySelector("[data-fetched-at]");
  let timer;
  const check = () => {
    if (!marker) return;
    const old = Date.now() - Date.parse(marker.dataset.fetchedAt) >= 300000;
    marker.querySelector("[data-refresh-note]").hidden = !old;
    document
      .querySelectorAll(".event-results,.event-details")
      .forEach((element) =>
        element.classList.toggle("event-needs-refresh", old),
      );
  };
  // A suspended tab never silently claims to have checked recent changes.
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") check();
  });
  window.addEventListener("pageshow", () => {
    check();
    clearInterval(timer);
    timer = setInterval(check, 30000);
  });
  window.addEventListener("pagehide", () => clearInterval(timer));
  document.querySelectorAll("[data-refresh]").forEach((link) =>
    link.addEventListener("click", (event) => {
      event.preventDefault();
      location.reload();
    }),
  );
  document.querySelectorAll(".event-cities details").forEach((details) =>
    details.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        details.open = false;
        details.querySelector("summary").focus();
      }
    }),
  );
  check();
})();
