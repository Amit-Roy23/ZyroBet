import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const docsDir = path.join(projectRoot, 'docs');

if (!fs.existsSync(docsDir)) {
  fs.mkdirSync(docsDir, { recursive: true });
}

const outputPath = path.join(docsDir, 'fingerprint.baseline.json');

console.log('Generating baseline fingerprint...');
try {
  const result = execSync('npx @expo/fingerprint fingerprint:generate', {
    cwd: projectRoot,
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024,
  });

  const parsed = JSON.parse(result.trim());
  fs.writeFileSync(outputPath, JSON.stringify(parsed, null, 2), 'utf8');
  console.log(`\x1b[32m✔ Baseline fingerprint generated successfully: ${parsed.hash}\x1b[0m`);
  console.log(`Saved to ${outputPath}`);
} catch (error) {
  console.error('\x1b[31m✖ Failed to generate fingerprint:\x1b[0m', error);
  process.exit(1);
}
