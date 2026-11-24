import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const PATTERNS = [/\[[^\]]+\]/, /PLACEHOLDER/, /example\.com/];

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) yield* walk(p);
    else if (p.endsWith('.yml')) yield p;
  }
}

let count = 0;
for (const file of walk('src/content')) {
  readFileSync(file, 'utf8')
    .split(/\r?\n/)
    .forEach((line, i) => {
      if (PATTERNS.some((re) => re.test(line))) {
        count += 1;
        console.log(`${file}:${i + 1}  ${line.trim()}`);
      }
    });
}
console.log(count ? `\n${count} placeholder(s) left to fill.` : 'No placeholders left. Ready to launch.');
