import { access, copyFile, lstat, mkdir, readFile, realpath, rmdir, symlink, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawn } from 'node:child_process';
import { resolveBuildRuntime } from '../assets/frontend-template/scripts/resolve-build-runtime.mjs';

const skillRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const legacyCaches = ['.cache', 'preview', '../preview'];
const requiredPackages = ['react', 'react-dom', 'antd', '@ant-design/icons', 'typescript', 'vite'];

async function exists(path) {
  try { await access(path); return true; } catch { return false; }
}
function dependenciesOf(manifest) {
  return Object.fromEntries(['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies'].map(key =>
    [key, Object.fromEntries(Object.entries(manifest[key] ?? {}).sort(([left], [right]) => left.localeCompare(right)))]));
}
export async function dependencyIdentity(project) {
  const manifest = JSON.parse(await readFile(resolve(project, 'package.json'), 'utf8'));
  const lockName = await exists(resolve(project, 'pnpm-lock.yaml')) ? 'pnpm-lock.yaml' : 'package-lock.json';
  if (!await exists(resolve(project, lockName))) throw new Error('No supported lockfile found; prepare a lockfile first.');
  const lock = await readFile(resolve(project, lockName), 'utf8');
  const workspace = await exists(resolve(project, 'pnpm-workspace.yaml'))
    ? await readFile(resolve(project, 'pnpm-workspace.yaml'), 'utf8') : '';
  const dependencyPolicy = JSON.stringify({ dependencies: dependenciesOf(manifest), overrides: manifest.overrides,
    resolutions: manifest.resolutions, pnpm: manifest.pnpm, packageManager: manifest.packageManager, workspace });
  const key = createHash('sha256').update(dependencyPolicy).update(lockName).update(lock)
    .update(`${process.platform}/${process.arch}/${process.versions.node.split('.')[0]}`).digest('hex').slice(0, 20);
  return { manifest, lockName, key };
}
async function ready(project, runtimeRoot) {
  const nodeModules = resolve(project, 'node_modules');
  const found = await Promise.all(requiredPackages.map(name => exists(resolve(nodeModules, name, 'package.json'))));
  if (!found.every(Boolean)) return false;
  try {
    await resolveBuildRuntime({ projectRoot: project, nodeModules, viteBin: resolve(nodeModules, 'vite/bin/vite.js'), runtimeCacheRoot: runtimeRoot });
    return true;
  } catch { return false; }
}
export function runInstall(command, args, cwd, timeoutMs) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(command, args, { cwd, stdio: 'inherit', env: process.env });
    let timedOut = false;
    let forceKill;
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill('SIGTERM');
      forceKill = setTimeout(() => child.kill('SIGKILL'), 1000);
    }, timeoutMs);
    const cleanup = () => { clearTimeout(timer); clearTimeout(forceKill); };
    child.once('error', error => { cleanup(); reject(error); });
    child.once('close', code => {
      cleanup();
      if (timedOut) reject(new Error(`Dependency installation exceeded ${timeoutMs / 1000}s and was stopped`));
      else if (code !== 0) reject(new Error(`${command} exited with code ${code}`));
      else resolvePromise();
    });
  });
}
export async function preparePreview(project, { root = skillRoot, allowNetwork = false, timeoutMs = 60000 } = {}) {
  const started = performance.now();
  const runtimeRoot = resolve(root, '.cache/build-runtime');
  const identity = await dependencyIdentity(project);
  const projectModules = resolve(project, 'node_modules');
  let localModules;
  try { localModules = await lstat(projectModules); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  if (localModules?.isSymbolicLink()) {
    // A changed manifest must never install into another project's linked dependency tree.
    let actual;
    try { actual = await dependencyIdentity(dirname(await realpath(projectModules))); }
    catch { throw new Error('The linked dependency cache is missing or incomplete; repair or unlink it before preparing again'); }
    if (identity.key !== actual.key || !await ready(project, runtimeRoot)) {
      throw new Error('The linked dependency cache no longer matches this project or is unhealthy; repair or unlink it before preparing again');
    }
    return { source: 'existing', project, elapsedMs: Math.round(performance.now() - started) };
  }
  if (localModules) {
    if (!await ready(project, runtimeRoot)) throw new Error('Existing node_modules is incomplete or unhealthy; repair it before preparing again');
    return { source: 'existing', project, elapsedMs: Math.round(performance.now() - started) };
  }
  const cache = resolve(root, '.cache/dependencies', identity.key);
  for (const candidate of [cache, ...legacyCaches.map(path => resolve(root, path))]) {
    try {
      if ((await dependencyIdentity(candidate)).key !== identity.key) continue;
      if (!await ready(candidate, runtimeRoot)) continue;
    } catch { continue; }
    await symlink(relative(project, resolve(candidate, 'node_modules')), projectModules, 'dir');
    return { source: 'shared-cache', project, cache: candidate, elapsedMs: Math.round(performance.now() - started) };
  }
  await mkdir(dirname(cache), { recursive: true });
  const lockDir = `${cache}.prepare-lock`;
  try { await mkdir(lockDir); } catch (error) {
    if (error.code === 'EEXIST') throw new Error('This dependency cache is already being prepared; retry after that preparation finishes');
    throw error;
  }
  try {
    await mkdir(cache, { recursive: true });
    // Keep the exact locked manifest so npm and pnpm verify the same input as the Change.
    await writeFile(resolve(cache, 'package.json'), `${JSON.stringify({ ...identity.manifest, private: true }, null, 2)}\n`);
    await copyFile(resolve(project, identity.lockName), resolve(cache, identity.lockName));
    if (await exists(resolve(project, 'pnpm-workspace.yaml'))) await copyFile(resolve(project, 'pnpm-workspace.yaml'), resolve(cache, 'pnpm-workspace.yaml'));
    const manager = identity.lockName === 'pnpm-lock.yaml' ? 'pnpm' : 'npm';
    const args = manager === 'pnpm'
      ? ['install', '--frozen-lockfile', '--ignore-scripts', '--fetch-retries=0', '--fetch-timeout=10000', allowNetwork ? '--prefer-offline' : '--offline']
      : ['ci', '--ignore-scripts', '--no-audit', '--no-fund', '--fetch-retries=0', '--fetch-timeout=10000', ...(allowNetwork ? [] : ['--offline'])];
    console.log(`Preparing skill dependency cache (${allowNetwork ? 'network allowed' : 'offline'}, total timeout ${timeoutMs / 1000}s).`);
    await runInstall(manager, args, cache, timeoutMs);
    if (!await ready(cache, runtimeRoot)) throw new Error('Install finished but required packages or the Vite toolchain are unavailable; cache was not linked');
    await symlink(relative(project, resolve(cache, 'node_modules')), projectModules, 'dir');
    return { source: 'installed-cache', project, cache, elapsedMs: Math.round(performance.now() - started) };
  } finally { await rmdir(lockDir); }
}
async function main() {
  const args = process.argv.slice(2);
  const projectIndex = args.indexOf('--project');
  if (projectIndex < 0 || !args[projectIndex + 1]) throw new Error('Usage: node prepare-preview.mjs --project <directory> [--allow-network]');
  const result = await preparePreview(resolve(args[projectIndex + 1]), { allowNetwork: args.includes('--allow-network') });
  console.log(`Preview dependencies ready: ${result.source} (${result.elapsedMs}ms). Browser checks remain manual.`);
}
if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  main().catch(error => {
    console.error(`Preview dependency setup stopped: ${error.message}. Offline cache misses need one explicit --allow-network attempt; no automatic retry.`);
    process.exitCode = 1;
  });
}
