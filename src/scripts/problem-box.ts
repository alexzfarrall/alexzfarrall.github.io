import { buildProblemMailto } from '../lib/mailto';

export function initProblemBox(
  form: HTMLFormElement | null,
  navigate: (url: string) => void = (url) => window.location.assign(url),
): void {
  const field = form?.querySelector<HTMLTextAreaElement | HTMLInputElement>('textarea, input[name="body"]');
  const error = form?.querySelector<HTMLElement>('[data-error]');
  if (!form || !field || !error) return;
  form.noValidate = true;
  const email = form.dataset.email ?? '';

  field.addEventListener('input', () => {
    error.hidden = true;
    field.removeAttribute('aria-invalid');
    field.removeAttribute('aria-describedby');
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!field.value.trim()) {
      error.hidden = false;
      field.setAttribute('aria-invalid', 'true');
      if (error.id) field.setAttribute('aria-describedby', error.id);
      field.focus();
      return;
    }
    navigate(buildProblemMailto(email, field.value));
  });
}

export function initProblemBoxes(
  doc: Document = document,
  navigate?: (url: string) => void,
): void {
  doc.querySelectorAll<HTMLFormElement>('form[data-problem-box]').forEach((form) => initProblemBox(form, navigate));
}
