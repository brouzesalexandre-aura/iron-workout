#!/usr/bin/env node
/**
 * Assemble les sources en une page HTML autonome.
 *
 * IRON est distribuée comme un fichier unique : l'APK Android l'embarque tel quel
 * dans ses assets, et il s'ouvre aussi directement dans un navigateur. Ce script
 * est le seul endroit qui connaît l'ordre de concaténation.
 *
 *   node tools/build.mjs            construit dist/index.html
 *   node tools/build.mjs --check    vérifie que la sortie est à jour (CI)
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, copyFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const cfg = JSON.parse(readFileSync(join(ROOT, 'build.config.json'), 'utf8'));
const read = (p) => readFileSync(join(ROOT, p), 'utf8');
const b64 = (p) => readFileSync(join(ROOT, p)).toString('base64');

/* ---- manifeste PWA : les icônes redeviennent des data: URI ---- */
function inlineManifest() {
  const man = JSON.parse(read('src/manifest.json'));
  man.icons = man.icons.map((ic) => ({
    ...ic,
    src: `data:${ic.type};base64,${b64(join('src', ic.src))}`,
  }));
  return 'data:application/manifest+json;base64,' +
    Buffer.from(JSON.stringify(man), 'utf8').toString('base64');
}

function banner(file) {
  return `\n/* ===== ${file} ===== */\n`;
}

function build() {
  const styles = cfg.styles.map((f) => `/* ===== ${f} ===== */\n` + read(f)).join('\n');
  const scripts = cfg.scripts
    .map((f) => banner(f) + read(f))
    .join('\n')
    .replaceAll('@@GH_REPO@@', cfg.repo)
    .replaceAll('@@VERSION@@', read(cfg.versionFile).trim());

  let html = read('src/index.html')
    .replace('@@MANIFEST@@', inlineManifest())
    .replace('@@APPLE_ICON@@', `data:image/png;base64,${b64('src/assets/apple-touch-icon.png')}`)
    .replace('@@STYLES@@', styles)
    .replace('@@SCRIPTS@@', scripts);

  const missing = html.match(/@@[A-Z_]+@@/g);
  if (missing) throw new Error(`marqueur non remplacé : ${[...new Set(missing)].join(', ')}`);
  return html;
}

const html = build();

if (process.argv.includes('--check')) {
  const cur = existsSync(join(ROOT, cfg.out)) ? read(cfg.out) : '';
  if (cur !== html) {
    console.error(`✗ ${cfg.out} n'est pas à jour — lance « npm run build » et commite le résultat.`);
    process.exit(1);
  }
  console.log(`✓ ${cfg.out} est à jour (${html.length} caractères)`);
  process.exit(0);
}

mkdirSync(join(ROOT, dirname(cfg.out)), { recursive: true });
writeFileSync(join(ROOT, cfg.out), html);
for (const dest of cfg.alsoCopyTo || []) {
  mkdirSync(join(ROOT, dirname(dest)), { recursive: true });
  copyFileSync(join(ROOT, cfg.out), join(ROOT, dest));
}
console.log(`✓ ${cfg.out} — ${cfg.styles.length} feuilles de style, ${cfg.scripts.length} modules, ${html.length} caractères`);
