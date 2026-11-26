/**
 * Project pop-outs. Cards with details link to /projects/<id>/; a plain click loads that page's
 * [data-project] article into a modal dialog instead. Anything that fails falls back to the link.
 */
interface Options {
  fetcher?: (url: string) => Promise<Response>;
  navigate?: (url: string) => void;
}

/** A pop-out that takes longer than this to load falls back to the plain link. */
export const LOAD_TIMEOUT = 2500;

export function initProjectDialog(doc: Document = document, opts: Options = {}): void {
  const win = doc.defaultView;
  if (!win || typeof win.HTMLDialogElement !== 'function' || typeof win.DOMParser !== 'function') return;
  const fetcher = opts.fetcher ?? ((u: string) => win.fetch(u));
  const navigate = opts.navigate ?? ((u: string) => win.location.assign(u));
  const cache = new Map<string, Promise<Element>>();
  let dialog: HTMLDialogElement | undefined;
  let scroller: HTMLElement;
  let opener: HTMLElement | null = null;
  // Only the latest click may open the pop-out; closing it cancels anything still loading.
  let seq = 0;

  const load = (url: string): Promise<Element> => {
    let hit = cache.get(url);
    if (!hit) {
      hit = fetcher(url)
        .then((r) => (r.ok ? r.text() : Promise.reject(new Error(String(r.status)))))
        .then((html) => {
          const article = new win.DOMParser().parseFromString(html, 'text/html').querySelector('[data-project]');
          if (!article) throw new Error('no project');
          return article;
        });
      hit.catch(() => cache.delete(url));
      cache.set(url, hit);
    }
    return hit;
  };

  const make = (): HTMLDialogElement => {
    const d = doc.createElement('dialog');
    d.className = 'pm';
    const x = doc.createElement('button');
    x.type = 'button';
    x.className = 'pm__x';
    x.setAttribute('aria-label', 'Close');
    x.textContent = '×';
    scroller = doc.createElement('div');
    scroller.className = 'pm__scroll';
    // The scrolling container takes focus on open (not the close button), so no ring shows
    // and arrow keys / Page Down scroll the content straight away.
    scroller.tabIndex = -1;
    scroller.autofocus = true;
    d.append(x, scroller);
    x.addEventListener('click', () => d.close());
    d.addEventListener('cancel', (e) => { e.preventDefault(); d.close(); });
    // The backdrop belongs to the dialog element itself; content clicks target its children.
    let downOnBackdrop = false;
    d.addEventListener('pointerdown', (e) => { downOnBackdrop = e.target === d; });
    d.addEventListener('click', (e) => {
      if (e.target === d && downOnBackdrop) d.close();
      downOnBackdrop = false;
    });
    d.addEventListener('close', () => {
      seq++;
      opener?.focus();
      opener = null;
    });
    doc.body.append(d);
    return d;
  };

  const show = (article: Element, link: HTMLElement) => {
    dialog ??= make();
    const node = doc.importNode(article, true) as HTMLElement;
    // One h1 per page: inside the homepage dialog the title becomes an h2.
    const h1 = node.querySelector('h1');
    if (h1) {
      const h2 = doc.createElement('h2');
      for (const a of Array.from(h1.attributes)) h2.setAttribute(a.name, a.value);
      h2.append(...Array.from(h1.childNodes));
      h1.replaceWith(h2);
    }
    if (h1?.id) dialog.setAttribute('aria-labelledby', h1.id);
    scroller.replaceChildren(node);
    scroller.scrollTop = 0;
    if (!dialog.open) dialog.showModal();
    opener = link;
    // Keep the close button clear of a classic (space-taking) scrollbar.
    dialog.style.setProperty('--pm-sb', `${scroller.offsetWidth - scroller.clientWidth}px`);
    scroller.focus();
  };

  const linkFrom = (t: EventTarget | null) =>
    (t as Element | null)?.closest?.<HTMLAnchorElement>('a[data-details][href]') ?? null;

  doc.addEventListener('click', (e) => {
    const link = linkFrom(e.target);
    if (!link || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    const id = ++seq;
    const fallback = () => {
      clearTimeout(timer);
      if (id !== seq) return;
      seq++;
      navigate(link.href);
    };
    const timer = setTimeout(fallback, LOAD_TIMEOUT);
    load(link.href)
      .then((a) => {
        if (id !== seq) return;
        clearTimeout(timer);
        show(a, link);
      })
      .catch(fallback);
  });
  const prefetch = (e: Event) => {
    const link = linkFrom(e.target);
    if (link) load(link.href).catch(() => {});
  };
  doc.addEventListener('pointerover', prefetch);
  doc.addEventListener('focusin', prefetch);
}
