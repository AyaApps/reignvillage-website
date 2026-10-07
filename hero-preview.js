// Native controls remain usable without JavaScript; motion is opt-in for reduced-motion visitors.
const preview = document.querySelector(".hero-preview");
if (preview) {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (!reducedMotion.matches && !navigator.connection?.saveData) {
    preview.play().catch(() => { /* Native Play remains available when autoplay is blocked. */ });
  }
  reducedMotion.addEventListener("change", (event) => {
    if (event.matches) preview.pause();
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) preview.pause();
  });
}
