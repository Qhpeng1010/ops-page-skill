#!/usr/bin/env node
// Skill maintenance only; ordinary page generation copies this prebuilt bundle.
import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { hash, runtimePath, sourceHashes, verifySpecRuntime } from './lib/spec-runtime-integrity.mjs';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const index = args.indexOf('--dependencies');
if (args.includes('--help')) {
  console.log('Maintenance: node scripts/build-spec-runtime.mjs --dependencies <prepared React project or cache directory>');
  process.exit(0);
}
const candidates = index >= 0 ? [resolve(args[index + 1])] : [
  ...(await readdir(resolve(root, '.cache/dependencies')).catch(() => [])).map(name => resolve(root, '.cache/dependencies', name)),
  resolve(root, '../preview'),
];
let req;
for (const dir of candidates) {
  try { const candidate = createRequire(resolve(dir, 'package.json')); candidate.resolve('antd'); candidate.resolve('vite'); req = candidate; break; } catch {}
}
if (!req) throw new Error('No prepared local dependencies. Pass --dependencies; this maintenance command never installs packages.');
const template = JSON.parse(await readFile(resolve(root, 'assets/frontend-template/package.json'), 'utf8'));
const lock = await readFile(resolve(root, 'assets/frontend-template/pnpm-lock.yaml'), 'utf8');
const packages = ['react', 'react-dom', 'antd', '@ant-design/icons'];
const versions = Object.fromEntries(packages.map(name => [name, req(`${name}/package.json`).version]));
for (const [name, version] of Object.entries(versions)) {
  if (!lock.includes(`version: ${version}`) || Number(version.split('.')[0]) !== Number(template.dependencies[name].replace(/^[~^]/, '').split('.')[0])) throw new Error(`Local ${name}@${version} does not match the React template lock.`);
}
const esbuild = createRequire(req.resolve('vite'))('esbuild');
const out = resolve(root, runtimePath, 'vendor');
await mkdir(out, { recursive: true });
const result = await esbuild.build({
  absWorkingDir: root, entryPoints: [resolve(root, runtimePath, 'platform-entry.ts')], outfile: resolve(out, 'ops-platform.js'),
  bundle: true, minify: true, metafile: true, write: false, format: 'iife', globalName: 'OpsPlatform', platform: 'browser',
  target: ['es2020'], jsx: 'automatic', define: { 'process.env.NODE_ENV': '"production"' },
  alias: Object.fromEntries(packages.map(name => [name, dirname(req.resolve(`${name}/package.json`))])),
  nodePaths: [...req.resolve.paths('react'), resolve(dirname(req.resolve('antd/package.json')), '..')],
  plugins: [{ name: 'shared-platform-adapter', setup(build) {
    build.onResolve({ filter: /platform\.config\.json$/ }, () => ({ path: 'platform-config', namespace: 'injected' }));
    build.onLoad({ filter: /.*/, namespace: 'injected' }, () => ({ contents: 'export default window.__OPS_PLATFORM_CONFIG__;', loader: 'js' }));
    build.onLoad({ filter: /[/\\]PlatformShell\.tsx$/ }, async ({ path }) => {
      let contents = await readFile(path, 'utf8');
      for (const [name, source] of [['expanded', '展开'], ['collapsed', '收起']]) {
        const uri = 'data:image/svg+xml;base64,' + (await readFile(resolve(root, `modules/operations/shell/易宝支付:${source}.svg`))).toString('base64');
        const original = `new URL('./logo-${name}.svg', import.meta.url).href`;
        if (!contents.includes(original)) throw new Error(`Logo adapter no longer matches shared Shell: ${name}`);
        contents = contents.replace(original, JSON.stringify(uri));
      }
      return { contents, loader: 'tsx', resolveDir: dirname(path) };
    });
  } }],
});
for (const output of Object.values(result.metafile.outputs)) {
  if (output.imports.length) throw new Error('Shared platform must not have unresolved runtime imports.');
}
const sharedInputs = Object.keys(result.metafile.inputs).filter(path => path.startsWith('modules/operations/shell/')).sort();
const assets = {};
for (const file of result.outputFiles) { assets[relative(out, file.path)] = hash(file.contents); await writeFile(file.path, file.contents); }
const manifest = { schemaVersion: 1, versions, sharedInputs, sources: await sourceHashes(root), assets };
await writeFile(resolve(out, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
await verifySpecRuntime(root);
console.log('Shared platform bundle built from canonical Shell/Provider/query/table. Versions: ' + JSON.stringify(versions));
