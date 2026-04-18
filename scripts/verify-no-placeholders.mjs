import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const filesToCheck = [
  'src/main.tsx',
  'src/App.tsx',
  'api/health.ts',
  'api/env-check.ts',
  'api/send-test-email.ts',
];

const forbiddenSnippets = ['<Contents of', 'TODO: replace me'];
const failures = [];

for (const relPath of filesToCheck) {
  const content = readFileSync(join(process.cwd(), relPath), 'utf8');

  for (const token of forbiddenSnippets) {
    if (content.includes(token)) {
      failures.push(`${relPath} contains forbidden placeholder token: ${token}`);
    }
  }
}

if (failures.length > 0) {
  console.error('Build guard failed:\n' + failures.join('\n'));
  process.exit(1);
}

console.log('Build guard passed: no placeholder content found.');
