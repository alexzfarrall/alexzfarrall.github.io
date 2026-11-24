import { Window } from 'happy-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { initProjectDialog } from '../../src/scripts/project-dialog';

const page = `<!doctype html><html><body><header>x</header>
<article data-project aria-labelledby="pd-title"><h1 class="pd__title" id="pd-title">PhoBac</h1><p class="pd__sum">Summary</p></article>
</body></html>`;

let doc: Document;
let link: HTMLAnchorElement;
type Fetcher = (url: string) => Promise<Response>;
let fetcher: ReturnType<typeof vi.fn<Fetcher>>;
let navigate: ReturnType<typeof vi.fn<(url: string) => void>>;
const flush = () => new Promise((r) => setTimeout(r, 0));
const dialog = () => doc.querySelector<HTMLDialogElement>('dialog.pm');
const click = (el: Element, init: MouseEventInit = {}) => {
  const e = new (doc.defaultView as any).MouseEvent('click', { bubbles: true, cancelable: true, button: 0, ...init });
  el.dispatchEvent(e);
  return e as MouseEvent;
};
const open = async () => {
  link.focus();
  click(link);
  await flush();
  await flush();
};

beforeEach(() => {
  const win = new Window({ url: 'http://localhost/' });
  doc = win.document as unknown as Document;
  doc.body.innerHTML = '<a href="/projects/phobac/" data-details>Card</a><a href="/other/">Other</a>';
  link = doc.querySelector('a')!;
  fetcher = vi.fn<Fetcher>(async () => new Response(page, { status: 200 }));
  navigate = vi.fn<(url: string) => void>();
  initProjectDialog(doc, { fetcher, navigate });
});

describe('project dialog', () => {
  it('opens the project article in a modal on a plain click', async () => {
    const e = click(link);
    expect(e.defaultPrevented).toBe(true);
    await flush();
    await flush();
    const d = dialog()!;
    expect(d.open).toBe(true);
    expect(fetcher).toHaveBeenCalledWith('http://localhost/projects/phobac/');
    expect(d.querySelector('[data-project] h2#pd-title')?.textContent).toBe('PhoBac');
    expect(d.querySelector('h1')).toBeNull();
    expect(d.getAttribute('aria-labelledby')).toBe('pd-title');
    expect(d.querySelector('button.pm__x')?.getAttribute('aria-label')).toBe('Close');
    expect(doc.activeElement).toBe(d.querySelector('.pm__scroll'));
    expect(navigate).not.toHaveBeenCalled();
  });

  it('ignores modified and non-primary clicks and ordinary links', () => {
    for (const init of [{ ctrlKey: true }, { metaKey: true }, { shiftKey: true }, { altKey: true }, { button: 1 }]) {
      expect(click(link, init).defaultPrevented).toBe(false);
    }
    expect(click(doc.querySelectorAll('a')[1]).defaultPrevented).toBe(false);
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('follows the link when the fetch fails or the page has no project', async () => {
    fetcher.mockImplementationOnce(async () => { throw new Error('offline'); });
    click(link);
    await flush();
    await flush();
    expect(navigate).toHaveBeenCalledWith('http://localhost/projects/phobac/');
    fetcher.mockImplementationOnce(async () => new Response('<p>nope</p>', { status: 200 }));
    click(link);
    await flush();
    await flush();
    expect(navigate).toHaveBeenCalledTimes(2);
    expect(dialog()?.open ?? false).toBe(false);
  });

  it('caches by URL and prefetches on hover', async () => {
    link.dispatchEvent(new (doc.defaultView as any).Event('pointerover', { bubbles: true }));
    await open();
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('closes on the close button and returns focus to the card link', async () => {
    await open();
    dialog()!.querySelector<HTMLButtonElement>('.pm__x')!.click();
    expect(dialog()!.open).toBe(false);
    expect(doc.activeElement).toBe(link);
  });

  it('closes on a backdrop click but not on a content click', async () => {
    await open();
    const d = dialog()!;
    const content = d.querySelector('.pd__sum')!;
    content.dispatchEvent(new (doc.defaultView as any).PointerEvent('pointerdown', { bubbles: true }));
    click(content);
    expect(d.open).toBe(true);
    d.dispatchEvent(new (doc.defaultView as any).PointerEvent('pointerdown', { bubbles: true }));
    click(d);
    expect(d.open).toBe(false);
    expect(doc.activeElement).toBe(link);
  });

  it('closes on cancel (Escape)', async () => {
    await open();
    const d = dialog()!;
    d.dispatchEvent(new (doc.defaultView as any).Event('cancel', { cancelable: true }));
    expect(d.open).toBe(false);
    expect(doc.activeElement).toBe(link);
  });
});
