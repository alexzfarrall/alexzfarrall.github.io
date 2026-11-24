export const PROBLEM_SUBJECT = 'A problem for you';

export function buildProblemMailto(email: string, problem: string): string {
  const body = problem.trim().replace(/\r?\n/g, '\r\n');
  if (!body) throw new Error('Problem text is empty');
  return `mailto:${email}?subject=${encodeURIComponent(PROBLEM_SUBJECT)}&body=${encodeURIComponent(body)}`;
}
