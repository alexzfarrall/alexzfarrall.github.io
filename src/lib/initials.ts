export function initials(name: string): string {
  const words = name.replace(/[^\p{L}\p{N}\s-]/gu, ' ').split(/[\s-]+/).filter(Boolean);
  if (words.length === 0) return '–';
  if (words.length === 1) {
    const w = words[0];
    return w === w.toUpperCase() ? w.slice(0, 2) : w[0].toUpperCase() + w.slice(1, 2);
  }
  return (words[0][0] + words[1][0]).toUpperCase();
}
