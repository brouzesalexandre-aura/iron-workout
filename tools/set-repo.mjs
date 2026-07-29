#!/usr/bin/env node
/**
 * Pointe le dépôt vers un autre compte GitHub.
 *
 * Le nom du dépôt apparaît à trois endroits : la configuration de build (qui
 * l'injecte dans le code de mise à jour), les badges du README et le pont natif
 * Android (via -PghRepo, lu depuis build.config.json au moment du build). Ce
 * script les met à jour d'un coup et reconstruit dist/.
 *
 *   node tools/set-repo.mjs mon-compte/iron-workout
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const slug = process.argv[2];

if (!slug || !/^[\w.-]+\/[\w.-]+$/.test(slug)) {
  console.error('usage : node tools/set-repo.mjs <compte>/<dépôt>');
  process.exit(1);
}

const cfgPath = join(ROOT, 'build.config.json');
const cfg = JSON.parse(readFileSync(cfgPath, 'utf8'));
const old = cfg.repo;
cfg.repo = slug;
writeFileSync(cfgPath, JSON.stringify(cfg, null, 2) + '\n');

const readmePath = join(ROOT, 'README.md');
writeFileSync(readmePath, readFileSync(readmePath, 'utf8').replaceAll(old, slug));

execFileSync(process.execPath, [join(ROOT, 'tools/build.mjs')], { stdio: 'inherit' });
console.log(`✓ dépôt : ${old} → ${slug}`);
