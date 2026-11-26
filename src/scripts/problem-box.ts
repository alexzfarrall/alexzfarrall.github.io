/** The "Bring me a challenge" form: checks the visitor's message and email, then sends it without leaving the page. */
export type Send = (form: HTMLFormElement) => Promise<boolean>;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const isEmail = (v: string): boolean => EMAIL.test(v.trim());

/** Posts the form to its action (Web3Forms) and reports whether it was accepted. */
export const postForm: Send = async (form) => {
  try {
    const res = await fetch(form.action, { method: 'POST', headers: { Accept: 'application/json' }, body: new FormData(form) });
    const data = (await res.json().catch(() => ({}))) as { success?: boolean };
    return res.ok && data.success !== false;
  } catch {
    return false;
  }
};

export function initProblemBox(form: HTMLFormElement | null, send: Send = postForm): void {
  const message = form?.querySelector<HTMLTextAreaElement>('textarea[name="message"]');
  const email = form?.querySelector<HTMLInputElement>('input[name="email"]');
  const error = form?.querySelector<HTMLElement>('[data-error]');
  const button = form?.querySelector<HTMLButtonElement>('button[type="submit"]');
  if (!form || !message || !email || !error || !button) return;
  form.noValidate = true;
  const label = button.innerHTML;

  const clear = (field: HTMLElement) => {
    error.hidden = true;
    field.removeAttribute('aria-invalid');
    field.removeAttribute('aria-describedby');
  };
  const fail = (field: HTMLElement, text: string) => {
    error.textContent = text;
    error.hidden = false;
    field.setAttribute('aria-invalid', 'true');
    if (error.id) field.setAttribute('aria-describedby', error.id);
    field.focus();
  };
  message.addEventListener('input', () => clear(message));
  email.addEventListener('input', () => clear(email));

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!message.value.trim()) return fail(message, 'Describe your challenge first.');
    if (!isEmail(email.value)) return fail(email, 'Add your email so I can reply.');
    button.disabled = true;
    button.textContent = 'Sending…';
    const ok = await send(form);
    if (ok) {
      const done = form.ownerDocument.createElement('p');
      done.className = 'problem__done';
      done.setAttribute('role', 'status');
      done.tabIndex = -1;
      done.textContent = `Thank you. I'll reply to ${email.value.trim()} soon.`;
      form.replaceWith(done);
      done.focus();
      return;
    }
    button.disabled = false;
    button.innerHTML = label;
    error.textContent = 'That did not send. Please try again in a moment.';
    error.hidden = false;
  });
}

export function initProblemBoxes(doc: Document = document, send?: Send): void {
  doc.querySelectorAll<HTMLFormElement>('form[data-problem-box]').forEach((form) => initProblemBox(form, send));
}
