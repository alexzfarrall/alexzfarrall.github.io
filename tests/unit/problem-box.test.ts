// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { initProblemBox, initProblemBoxes } from '../../src/scripts/problem-box';

let form: HTMLFormElement;
let field: HTMLTextAreaElement;
let error: HTMLElement;
let navigate: Mock<(url: string) => void>;

const submit = () => form.dispatchEvent(new Event('submit', { cancelable: true }));

beforeEach(() => {
  document.body.innerHTML = `
    <form data-problem-box data-email="a@b.co">
      <textarea required></textarea>
      <p id="err" data-error hidden>Describe your problem first.</p>
      <button type="submit">Send</button>
    </form>`;
  form = document.querySelector('form')!;
  field = form.querySelector('textarea')!;
  error = form.querySelector<HTMLElement>('[data-error]')!;
  navigate = vi.fn<(url: string) => void>();
  initProblemBox(form, navigate);
});

describe('problem box', () => {
  it('turns off native validation so the inline message is used', () => {
    expect(form.noValidate).toBe(true);
  });

  it('shows an inline error and does not navigate when empty', () => {
    field.value = '   ';
    submit();
    expect(navigate).not.toHaveBeenCalled();
    expect(error.hidden).toBe(false);
    expect(field.getAttribute('aria-invalid')).toBe('true');
    expect(field.getAttribute('aria-describedby')).toBe('err');
  });

  it('has no aria-describedby before an error', () => {
    expect(field.hasAttribute('aria-describedby')).toBe(false);
  });

  it('clears the error as soon as the visitor types', () => {
    submit();
    field.value = 'x';
    field.dispatchEvent(new Event('input'));
    expect(error.hidden).toBe(true);
    expect(field.hasAttribute('aria-invalid')).toBe(false);
    expect(field.hasAttribute('aria-describedby')).toBe(false);
  });

  it('opens a pre-filled email when there is text', () => {
    field.value = 'Detect crop disease';
    submit();
    expect(navigate).toHaveBeenCalledWith(
      'mailto:a@b.co?subject=A%20problem%20for%20you&body=Detect%20crop%20disease',
    );
  });

  it('does nothing without a form', () => {
    expect(() => initProblemBox(null, navigate)).not.toThrow();
  });
});

describe('input field', () => {
  const build = (id: string) => `
    <form data-problem-box data-email="a@b.co" id="${id}">
      <input name="body" required />
      <p data-error hidden>Describe your challenge first.</p>
      <button type="submit">Send</button>
    </form>`;

  it('works like the textarea', () => {
    document.body.innerHTML = build('f');
    const f = document.querySelector('form')!;
    const nav = vi.fn<(url: string) => void>();
    initProblemBox(f, nav);
    const input = f.querySelector('input')!;
    f.dispatchEvent(new Event('submit', { cancelable: true }));
    expect(nav).not.toHaveBeenCalled();
    expect(f.querySelector<HTMLElement>('[data-error]')!.hidden).toBe(false);
    input.value = 'Drones';
    f.dispatchEvent(new Event('submit', { cancelable: true }));
    expect(nav).toHaveBeenCalledWith('mailto:a@b.co?subject=A%20problem%20for%20you&body=Drones');
  });

  it('wires several forms independently', () => {
    document.body.innerHTML = build('one') + build('two');
    const nav = vi.fn<(url: string) => void>();
    initProblemBoxes(document, nav);
    const [one, two] = Array.from(document.querySelectorAll('form'));
    one.querySelector('input')!.value = 'First';
    one.dispatchEvent(new Event('submit', { cancelable: true }));
    two.dispatchEvent(new Event('submit', { cancelable: true }));
    expect(nav).toHaveBeenCalledTimes(1);
    expect(two.querySelector<HTMLElement>('[data-error]')!.hidden).toBe(false);
    expect(one.querySelector<HTMLElement>('[data-error]')!.hidden).toBe(true);
  });
});
