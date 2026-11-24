export function initReveal(doc: Document = document): void {
  const els = Array.from(doc.querySelectorAll<HTMLElement>('.reveal'));
  const win = doc.defaultView;
  const reduce = win?.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? true;
  if (!win || reduce || !('IntersectionObserver' in win)) {
    els.forEach((el) => el.classList.add('is-visible'));
    return;
  }
  // Sections already on screen are shown immediately, so turning the effect on never hides them.
  const pending = els.filter((el) => {
    const rect = el.getBoundingClientRect();
    const onScreen = rect.top < win.innerHeight && rect.bottom > 0;
    if (onScreen) el.classList.add('is-visible');
    return !onScreen;
  });
  doc.documentElement.classList.add('reveal-on');
  const observer = new win.IntersectionObserver(
    (entries, obs) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-visible');
        obs.unobserve(entry.target);
      }
    },
    { rootMargin: '0px 0px -10% 0px', threshold: 0.05 },
  );
  pending.forEach((el) => observer.observe(el));
}
