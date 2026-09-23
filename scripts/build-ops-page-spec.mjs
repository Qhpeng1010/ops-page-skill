#!/usr/bin/env node
import { cp, mkdtemp, mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { basename, dirname, isAbsolute, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { verifySpecRuntime } from './lib/spec-runtime-integrity.mjs';
import { validateOpsPageSpec } from './validate-ops-page-spec.mjs';

const skillRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const runtimeRoot = resolve(skillRoot, 'modules/operations/runtime');

function option(args, name) {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : '';
}

function safeJson(value) {
  return JSON.stringify(value).replaceAll('<', '\\u003c').replaceAll('>', '\\u003e').replaceAll('&', '\\u0026');
}

async function main() {
  const startedAt = performance.now();
  const args = process.argv.slice(2);
  if (args.includes('--help')) {
    console.log('node scripts/build-ops-page-spec.mjs --spec changes/{change-id}/page-spec.json');
    return;
  }
  const specPath = option(args, '--spec') || args.find(arg => !arg.startsWith('-'));
  if (!specPath) throw new Error('Use --spec <page-spec.json>; see --help.');
  const absoluteSpec = isAbsolute(specPath) ? specPath : resolve(skillRoot, specPath);
  const projectRoot = dirname(absoluteSpec);
  const spec = JSON.parse(await readFile(absoluteSpec, 'utf8'));
  const result = validateOpsPageSpec(spec);
  if (!result.valid) throw new Error(result.errors.join('\n'));
  if (spec.status !== 'ready') throw new Error('page-spec.json status must be ready before a preview is built.');
  if (spec.metadata.changeId !== basename(projectRoot)) throw new Error('metadata.changeId must match the Change directory.');

  // Validate the shipped shared framework before touching an existing preview.
  const platform = await verifySpecRuntime(skillRoot);
  const config = JSON.parse(await readFile(resolve(skillRoot, 'modules/operations/platform.config.json'), 'utf8'));
  config.projects = [{ key: spec.shell.projectKey,
    name: spec.shell.projectName || config.projects.find(item => item.key === spec.shell.projectKey)?.name || spec.shell.projectKey }];
  if (spec.shell.brand) config.brand.name = spec.shell.brand;
  if (spec.shell.userName) config.shell.userName = spec.shell.userName;
  const template = await readFile(resolve(runtimeRoot, 'ops-page-spec-preview.template.html'), 'utf8');
  if (/https?:\/\//i.test(template)) throw new Error('Ops Page Spec template contains a remote URL; it must be self-contained.');
  const preview = template.replaceAll('__OPS_PAGE_SPEC_JSON__', safeJson(spec))
    .replaceAll('__OPS_PLATFORM_CONFIG_JSON__', safeJson(config));
  const previewAssets = resolve(projectRoot, 'preview-assets');
  const staged = await mkdtemp(resolve(projectRoot, '.preview-build-'));
  try {
    const assets = resolve(staged, 'preview-assets');
    await mkdir(resolve(assets, 'vendor'), { recursive: true });
    for (const file of ['ops-page-spec-runtime.js', 'ops-page-spec.css']) await cp(resolve(runtimeRoot, file), resolve(assets, file));
    for (const file of [...Object.keys(platform.assets), 'manifest.json']) await cp(resolve(runtimeRoot, 'vendor', file), resolve(assets, 'vendor', file));
    await writeFile(resolve(staged, 'preview.html'), preview);
    await rm(previewAssets, { recursive: true, force: true });
    await rename(assets, previewAssets);
    await rename(resolve(staged, 'preview.html'), resolve(projectRoot, 'preview.html'));
  } finally { await rm(staged, { recursive: true, force: true }); }

  const build = {
    schemaVersion: 1,
    runtime: 'ops-page-spec',
    source: 'page-spec.json',
    preview: 'preview.html',
    assets: 'preview-assets/',
    dependencies: 'modules/operations/runtime/vendor/',
    platformVersions: platform.versions,
    sharedFramework: 'modules/operations/shell/',
    generatedAt: new Date().toISOString(),
    timingsMs: { build: Math.round(performance.now() - startedAt) },
  };
  await writeFile(resolve(projectRoot, 'ops-page-spec-build.json'), `${JSON.stringify(build, null, 2)}\n`);
  await writeFile(resolve(projectRoot, 'preview-build.json'), `${JSON.stringify(build, null, 2)}\n`);
  console.log(`Generated ${resolve(projectRoot, 'preview.html')}`);
  console.log(`Copied local runtime and vendor to ${previewAssets}`);
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  main().catch(error => { console.error(`Ops Page Spec build failed: ${error.message}`); process.exitCode = 1; });
}
