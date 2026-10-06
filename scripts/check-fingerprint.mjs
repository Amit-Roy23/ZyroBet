import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const baselinePath = path.join(projectRoot, 'docs', 'fingerprint.baseline.json');
const currentTempPath = path.join(projectRoot, 'docs', 'fingerprint.current.json');

if (!fs.existsSync(baselinePath)) {
  console.error('\x1b[31m✖ docs/fingerprint.baseline.json not found. Run npm run fingerprint:generate first.\x1b[0m');
  process.exit(1);
}

console.log('Calculating current project native fingerprint...');
try {
  const result = execSync('npx @expo/fingerprint fingerprint:generate', {
    cwd: projectRoot,
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024,
  });

  const currentFingerprint = JSON.parse(result.trim());
  const baselineFingerprint = JSON.parse(fs.readFileSync(baselinePath, 'utf8'));

  fs.writeFileSync(currentTempPath, JSON.stringify(currentFingerprint, null, 2), 'utf8');

  if (currentFingerprint.hash === baselineFingerprint.hash) {
    console.log(`\x1b[32m✔ Fingerprint matches baseline: ${currentFingerprint.hash}\x1b[0m`);
    console.log('\x1b[32m✔ Safe for OTA update (no native binary changes detected).\x1b[0m');
    if (fs.existsSync(currentTempPath)) {
      fs.unlinkSync(currentTempPath);
    }
    process.exit(0);
  } else {
    console.warn('\x1b[33m⚠ WARNING: Project native fingerprint has changed!\x1b[0m');
    console.warn(`Baseline Hash: ${baselineFingerprint.hash}`);
    console.warn(`Current Hash:  ${currentFingerprint.hash}`);
    console.warn('\nRunning fingerprint diff:');
    try {
      const diffOutput = execSync(`npx @expo/fingerprint fingerprint:diff "${baselinePath}" "${currentTempPath}"`, {
        cwd: projectRoot,
        encoding: 'utf8',
      });
      console.log(diffOutput);
    } catch (diffErr) {
      console.log(diffErr.stdout || diffErr.message);
    }
    console.warn('\x1b[31m✖ A NEW NATIVE BUILD IS REQUIRED. Do not publish an OTA update expecting new native code.\x1b[0m');
    if (fs.existsSync(currentTempPath)) {
      fs.unlinkSync(currentTempPath);
    }
    process.exit(1);
  }
} catch (error) {
  console.error('\x1b[31m✖ Error during fingerprint check:\x1b[0m', error);
  process.exit(1);
}
