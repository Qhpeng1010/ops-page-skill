#!/usr/bin/env node
import { copyFileSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { resolveBuildRuntime } from './resolve-build-runtime.mjs';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const nodeModules = resolve(projectRoot, 'node_modules');
const tsc = resolve(nodeModules, 'typescript/bin/tsc');
const vite = resolve(nodeModules, 'vite/bin/vite.js');

function run(label, command, args, runtime) {
  const startedAt = performance.now();
  return new Promise((resolvePromise, reject) => {
    const child = spawn(runtime, [command, ...args], { cwd: projectRoot, stdio: 'inherit' });
    child.once('error', reject);
    child.once('exit', code => {
      if (code === 0) resolvePromise(Math.round(performance.now() - startedAt));
      else reject(new Error(`${label} failed with code ${code ?? 'unknown'}`));
    });
  });
}

function assetPathFromUrl(url) {
  return url.replace(/^\.\//, '').split('?')[0];
}

function buildStandalonePreview() {
  const startedAt = performance.now();
  const dist = resolve(projectRoot, 'dist');
  const distIndex = resolve(dist, 'index.html');
  const html = readFileSync(distIndex, 'utf8');
  const scriptMatch = html.match(/<script[^>]+src="([^"]+\.js)"[^>]*>/i);
  const styleMatch = html.match(/<link[^>]+href="([^"]+\.css)"[^>]*>/i);
  if (!scriptMatch || !styleMatch) throw new Error('Vite build did not produce a JavaScript bundle and stylesheet.');

  const previewAssets = resolve(projectRoot, 'preview-assets');
  rmSync(previewAssets, { recursive: true, force: true });
  mkdirSync(previewAssets, { recursive: true });
  const distAssets = resolve(dist, 'assets');
  for (const filename of readdirSync(distAssets)) {
    copyFileSync(resolve(distAssets, filename), resolve(previewAssets, filename));
  }

  const scriptFile = assetPathFromUrl(scriptMatch[1]);
  const styleFile = assetPathFromUrl(styleMatch[1]);
  const bundle = readFileSync(resolve(dist, scriptFile), 'utf8')
    .replaceAll('import.meta.url', 'document.baseURI')
    .replace(/new URL\("([^"\n]+\.svg)",document\.baseURI\)/g, 'new URL("./preview-assets/$1", document.baseURI)')
    .replace(/<\/script/gi, '<\\/script');
  const style = readFileSync(resolve(dist, styleFile), 'utf8').replace(/<\/style/gi, '<\\/style');
  const preview = `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>运营后台页面预览</title>
  <style>${style}</style>
</head>
<body>
  <div id="root"></div>
  <script>${bundle}</script>
</body>
</html>
`;
  const previewPath = resolve(projectRoot, 'preview.html');
  writeFileSync(previewPath, preview);
  writeFileSync(resolve(projectRoot, 'preview-build.json'), `${JSON.stringify({
    schemaVersion: 1,
    source: 'src/',
    preview: 'preview.html',
    assets: 'preview-assets/',
    generatedAt: new Date().toISOString(),
  }, null, 2)}\n`);
  console.log(`Generated ${previewPath}`);
  console.log(`Copied local assets to ${previewAssets}`);
  return Math.round(performance.now() - startedAt);
}

try {
  const buildStartedAt = performance.now();
  const runtime = await resolveBuildRuntime({
    projectRoot,
    nodeModules,
    viteBin: vite,
    runtimeCacheRoot: resolve(projectRoot, '../../.cache/build-runtime'),
  });
  if (runtime !== process.execPath) console.log('Using cached Rollup-compatible build runtime.');
  // These checks have independent outputs: TypeScript is read-only and Vite owns dist/.
  // Running them together shortens wall-clock time without weakening either required check.
  const [typecheckMs, viteMs] = await Promise.all([
    run('TypeScript check', tsc, ['--noEmit'], runtime),
    run('Vite build', vite, ['build', '--base', './', '--logLevel', 'error'], runtime),
  ]);
  const packageMs = buildStandalonePreview();
  const previewPath = resolve(projectRoot, 'preview-build.json');
  const build = JSON.parse(readFileSync(previewPath, 'utf8'));
  writeFileSync(previewPath, `${JSON.stringify({
    ...build,
    timingsMs: { typecheck: typecheckMs, vite: viteMs, package: packageMs, total: Math.round(performance.now() - buildStartedAt) },
  }, null, 2)}\n`);
  console.log(`Build timings: typecheck ${typecheckMs}ms, vite ${viteMs}ms, package ${packageMs}ms.`);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
