import { Window } from 'happy-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { initProjectDialog, LOAD_TIMEOUT } from '../../src/scripts/project-dialog';

const page = (title: string) => `<!doctype html><html><body><header>x</header>
<article data-project aria-labelledby="pd-title"><h1 class="pd__title" id="pd-title">${title}</h1><p class="pd__sum">Summary</p></article>
</body></html>`;

type Fetcher = (url: string) => Promise<Response>;
let win: Window;
let doc: Document;
let linkA: HTMLAnchorElement;
let linkB: HTMLAnchorElement;
let fetcher: ReturnType<typeof vi.fn<Fetcher>>;
let navigate: ReturnType<typeof vi.fn<(url: string) => void>>;
const flush = async () => {
  for (let i = 0; i < 10; i++) await Promise.resolve();
};
const dialog = () => doc.querySelector<HTMLDialogElement>('dialog.pm');
const title = () => dialog()?.querySelector('#pd-title')?.textContent;
const click = (el: Element, init: MouseEventInit = {}) => {
  const e = new (win as any).MouseEvent('click', { bubbles: true, cancelable: true, button: 0, ...init });
  el.dispatchEvent(e);
  return e as MouseEvent;
};
const ok = (t: string) => new Response(page(t), { status: 200 });
/** A response the test releases by hand. */
const deferred = () => {
  let release!: (r: Response) => void;
  const promise = new Promise<Response>((r) => { release = r; });
  return { promise, release };
};
const open = async (link = linkA) => {
  link.focus();
  click(link);
  await flush();
};
const closeButton = () => dialog()!.querySelector<HTMLButtonElement>('.pm__x')!;

beforeEach(() => {
  win = new Window({ url: 'http://localhost/' });
  doc = win.document as unknown as Document;
  doc.body.innerHTML =
    '<a id="a" href="/projects/a/" data-details>A</a><a id="b" href="/projects/b/" data-details>B</a><a href="/other/">Other</a>';
  linkA = doc.querySelector('#a')!;
  linkB = doc.querySelector('#b')!;
  fetcher = vi.fn<Fetcher>(async (u) => ok(u.includes('/b/') ? 'B' : 'A'));
  navigate = vi.fn<(url: string) => void>();
  initProjectDialog(doc, { fetcher, navigate });
});
afterEach(() => { vi.useRealTimers(); });

describe('project dialog', () => {
  it('opens the project article in a modal on a plain click', async () => {
    const e = click(linkA);
    expect(e.defaultPrevented).toBe(true);
    await flush();
    const d = dialog()!;
    expect(d.open).toBe(true);
    expect(fetcher).toHaveBeenCalledWith('http://localhost/projects/a/');
    expect(d.querySelector('[data-project] h2#pd-title')?.textContent).toBe('A');
    expect(d.querySelector('h1')).toBeNull();
    expect(d.getAttribute('aria-labelledby')).toBe('pd-title');
    expect(closeButton().getAttribute('aria-label')).toBe('Close');
    expect(doc.activeElement).toBe(d.querySelector('.pm__scroll'));
    expect(navigate).not.toHaveBeenCalled();
  });

  it('ignores modified and non-primary clicks and ordinary links', () => {
    for (const init of [{ ctrlKey: true }, { metaKey: true }, { shiftKey: true }, { altKey: true }, { button: 1 }]) {
      expect(click(linkA, init).defaultPrevented).toBe(false);
    }
    expect(click(doc.querySelectorAll('a')[2]).defaultPrevented).toBe(false);
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('follows the link when the fetch fails or the page has no project', async () => {
    fetcher.mockImplementationOnce(async () => { throw new Error('offline'); });
    click(linkA);
    await flush();
    expect(navigate).toHaveBeenCalledWith('http://localhost/projects/a/');
    fetcher.mockImplementationOnce(async () => new Response('<p>nope</p>', { status: 200 }));
    click(linkB);
    await flush();
    expect(navigate).toHaveBeenLastCalledWith('http://localhost/projects/b/');
    expect(navigate).toHaveBeenCalledTimes(2);
    expect(dialog()?.open ?? false).toBe(false);
  });

  it('follows the link when showing the pop-out throws', async () => {
    // happy-dom shares element classes between windows, so restore the spy afterwards.
    const spy = vi.spyOn((win as any).HTMLDialogElement.prototype, 'showModal').mockImplementation(() => {
      throw new Error('boom');
    });
    click(linkA);
    await flush();
    spy.mockRestore();
    expect(navigate).toHaveBeenCalledWith('http://localhost/projects/a/');
  });

  it('caches by URL and prefetches on hover', async () => {
    linkA.dispatchEvent(new (win as any).Event('pointerover', { bubbles: true }));
    await open();
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('shows only the latest click: a slow A then B shows B, and focus returns to B', async () => {
    const slowA = deferred();
    fetcher.mockImplementation((u) => (u.includes('/a/') ? slowA.promise : Promise.resolve(ok('B'))));
    linkA.focus();
    click(linkA);
    linkB.focus();
    click(linkB);
    await flush();
    expect(title()).toBe('B');
    slowA.release(ok('A'));
    await flush();
    expect(title()).toBe('B');
    expect(dialog()!.open).toBe(true);
    closeButton().click();
    expect(doc.activeElement).toBe(linkB);
    expect(navigate).not.toHaveBeenCalled();
  });

  it('closing the pop-out cancels a load that is still pending', async () => {
    await open(linkB);
    const slowA = deferred();
    fetcher.mockImplementation(() => slowA.promise);
    click(linkA);
    closeButton().click();
    slowA.release(ok('A'));
    await flush();
    expect(dialog()!.open).toBe(false);
    expect(title()).toBe('B');
    expect(navigate).not.toHaveBeenCalled();
  });

  it('falls back to the link when loading takes too long', () => {
    vi.useFakeTimers();
    fetcher.mockImplementation(() => new Promise<Response>(() => {}));
    click(linkA);
    vi.advanceTimersByTime(LOAD_TIMEOUT - 100);
    expect(navigate).not.toHaveBeenCalled();
    vi.advanceTimersByTime(200);
    expect(navigate).toHaveBeenCalledOnce();
    expect(navigate).toHaveBeenCalledWith('http://localhost/projects/a/');
    expect(dialog()).toBeNull();
  });

  it('closes on the close button and returns focus to the card link', async () => {
    await open();
    closeButton().click();
    expect(dialog()!.open).toBe(false);
    expect(doc.activeElement).toBe(linkA);
  });

  it('closes on a backdrop click but not on a content click', async () => {
    await open();
    const d = dialog()!;
    const content = d.querySelector('.pd__sum')!;
    content.dispatchEvent(new (win as any).PointerEvent('pointerdown', { bubbles: true }));
    click(content);
    expect(d.open).toBe(true);
    d.dispatchEvent(new (win as any).PointerEvent('pointerdown', { bubbles: true }));
    click(d);
    expect(d.open).toBe(false);
    expect(doc.activeElement).toBe(linkA);
  });

  it('closes on cancel (Escape)', async () => {
    await open();
    const d = dialog()!;
    d.dispatchEvent(new (win as any).Event('cancel', { cancelable: true }));
    expect(d.open).toBe(false);
    expect(doc.activeElement).toBe(linkA);
  });
});
