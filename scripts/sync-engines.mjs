import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR = path.resolve(__dirname, '..');
const SOURCE_DIR = path.join(ROOT_DIR, 'shared', 'engines');
const TARGET_DIR = path.join(ROOT_DIR, 'supabase', 'functions', '_shared', 'engines');

const isCheckOnly = process.argv.includes('--check');

function rewriteImportsForDeno(code) {
  // Matches `from './something'` or `from "../something"` and appends `.ts` if missing extension
  return code.replace(
    /from\s+['"](\.[^'"]+)['"]/g,
    (match, importPath) => {
      if (importPath.endsWith('.ts') || importPath.endsWith('.js') || importPath.endsWith('.json')) {
        return match;
      }
      return `from '${importPath}.ts'`;
    }
  ).replace(
    /export\s+\*\s+from\s+['"](\.[^'"]+)['"]/g,
    (match, importPath) => {
      if (importPath.endsWith('.ts') || importPath.endsWith('.js') || importPath.endsWith('.json')) {
        return match;
      }
      return `export * from '${importPath}.ts'`;
    }
  );
}

function run() {
  if (!fs.existsSync(SOURCE_DIR)) {
    console.error(`Source directory not found: ${SOURCE_DIR}`);
    process.exit(1);
  }

  const files = fs.readdirSync(SOURCE_DIR).filter((f) => f.endsWith('.ts'));

  if (!isCheckOnly && !fs.existsSync(TARGET_DIR)) {
    fs.mkdirSync(TARGET_DIR, { recursive: true });
  }

  let hasMismatch = false;

  for (const file of files) {
    const srcPath = path.join(SOURCE_DIR, file);
    const targetPath = path.join(TARGET_DIR, file);

    const rawContent = fs.readFileSync(srcPath, 'utf8');
    const rewritten = rewriteImportsForDeno(rawContent);
    const targetContent = `// DO NOT EDIT - GENERATED FROM shared/engines/${file}\n${rewritten}`;

    if (isCheckOnly) {
      if (!fs.existsSync(targetPath)) {
        console.error(`Missing synced engine file: ${targetPath}`);
        hasMismatch = true;
        continue;
      }
      const existingContent = fs.readFileSync(targetPath, 'utf8');
      if (existingContent.replace(/\r\n/g, '\n') !== targetContent.replace(/\r\n/g, '\n')) {
        console.error(`Engine file out of sync: ${file}`);
        hasMismatch = true;
      }
    } else {
      fs.writeFileSync(targetPath, targetContent, 'utf8');
      console.log(`Synced: ${file} -> supabase/functions/_shared/engines/${file}`);
    }
  }

  if (isCheckOnly) {
    if (hasMismatch) {
      console.error('❌ Engine files are out of sync! Run "npm run engines:sync" to update.');
      process.exit(1);
    } else {
      console.log('✅ All engine files in supabase/functions/_shared/engines are in sync.');
    }
  }
}

run();
