// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { initProblemBox, initProblemBoxes, isEmail, type Send } from '../../src/scripts/problem-box';

let form: HTMLFormElement;
let message: HTMLTextAreaElement;
let email: HTMLInputElement;
let error: HTMLElement;
let send: Mock<Send>;

const submit = () => form.dispatchEvent(new Event('submit', { cancelable: true }));
const flush = () => new Promise((r) => setTimeout(r, 0));

beforeEach(() => {
  document.body.innerHTML = `
    <form data-problem-box action="https://api.web3forms.com/submit" method="POST">
      <textarea name="message" required></textarea>
      <input name="name" />
      <input name="email" type="email" required />
      <p id="err" data-error hidden></p>
      <button type="submit">Send <span>→</span></button>
    </form>`;
  form = document.querySelector('form')!;
  message = form.querySelector('textarea')!;
  email = form.querySelector('input[name="email"]')!;
  error = form.querySelector<HTMLElement>('[data-error]')!;
  send = vi.fn<Send>().mockResolvedValue(true);
  initProblemBox(form, send);
});

describe('isEmail', () => {
  it('accepts normal addresses and rejects incomplete ones', () => {
    expect(isEmail('a.b@c.co')).toBe(true);
    expect(isEmail('  a@b.org ')).toBe(true);
    for (const bad of ['', 'a', 'a@', 'a@b', 'a@b.c', 'a b@c.com', '@c.com']) expect(isEmail(bad)).toBe(false);
  });
});

describe('challenge form', () => {
  it('turns off native validation so the inline message is used', () => {
    expect(form.noValidate).toBe(true);
  });

  it('asks for the challenge first and does not send', () => {
    email.value = 'a@b.co';
    submit();
    expect(send).not.toHaveBeenCalled();
    expect(error.hidden).toBe(false);
    expect(error.textContent).toMatch(/challenge/);
    expect(message.getAttribute('aria-invalid')).toBe('true');
    expect(message.getAttribute('aria-describedby')).toBe('err');
  });

  it('asks for a valid email and does not send', () => {
    message.value = 'Detect crop disease';
    email.value = 'not-an-email';
    submit();
    expect(send).not.toHaveBeenCalled();
    expect(error.textContent).toMatch(/email/);
    expect(email.getAttribute('aria-invalid')).toBe('true');
  });

  it('clears the error as soon as the visitor types', () => {
    submit();
    message.value = 'x';
    message.dispatchEvent(new Event('input'));
    expect(error.hidden).toBe(true);
    expect(message.hasAttribute('aria-invalid')).toBe(false);
  });

  it('sends a valid form and replaces it with a thank-you naming their email', async () => {
    message.value = 'Detect crop disease';
    email.value = ' a@b.co ';
    submit();
    await flush();
    expect(send).toHaveBeenCalledWith(form);
    const done = document.querySelector('.problem__done');
    expect(done?.textContent).toBe("Thank you. I'll reply to a@b.co soon.");
    expect(document.activeElement).toBe(done);
    expect(document.querySelector('form')).toBeNull();
  });

  it('keeps the form and offers a retry when sending fails', async () => {
    send.mockResolvedValue(false);
    message.value = 'Detect crop disease';
    email.value = 'a@b.co';
    submit();
    await flush();
    expect(document.querySelector('form')).toBe(form);
    expect(error.hidden).toBe(false);
    expect(error.textContent).toMatch(/try again/);
    const button = form.querySelector('button')!;
    expect(button.disabled).toBe(false);
    expect(button.textContent).toBe('Send →');
  });

  it('initialises every challenge form on the page', () => {
    document.body.innerHTML = `<form data-problem-box><textarea name="message"></textarea><input name="email"/><p data-error hidden></p><button type="submit">Send</button></form>`;
    const s = vi.fn<Send>();
    initProblemBoxes(document, s);
    expect(document.querySelector('form')!.noValidate).toBe(true);
  });
});
