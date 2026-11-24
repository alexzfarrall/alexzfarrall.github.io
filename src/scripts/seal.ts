export function initSeal(doc: Document = document): void {
  const win = doc.defaultView;
  const ring = doc.querySelector<SVGElement>('[data-seal] .seal__ring');
  if (!win || !ring) return;
  if (win.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  let queued = false;
  win.addEventListener(
    'scroll',
    () => {
      if (queued) return;
      queued = true;
      win.requestAnimationFrame(() => {
        queued = false;
        ring.style.transform = `rotate(${win.scrollY * 0.15}deg)`;
      });
    },
    { passive: true },
  );
}
