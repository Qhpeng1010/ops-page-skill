import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
export const runtimePath = 'modules/operations/runtime';
export const hash = bytes => createHash('sha256').update(bytes).digest('hex');
export async function sourceHashes(root) {
  const shell = 'modules/operations/shell';
  const files = (await readdir(resolve(root, shell))).filter(name => /\.(tsx|css|svg)$/.test(name)).map(name => `${shell}/${name}`);
  files.push(`${runtimePath}/platform-entry.ts`, 'assets/frontend-template/package.json', 'assets/frontend-template/pnpm-lock.yaml', 'scripts/build-spec-runtime.mjs');
  return Object.fromEntries(await Promise.all(files.sort().map(async file => [file, hash(await readFile(resolve(root, file)))])));
}
export async function verifySpecRuntime(root) {
  const manifest = JSON.parse(await readFile(resolve(root, runtimePath, 'vendor/manifest.json'), 'utf8'));
  const sources = await sourceHashes(root);
  if (manifest.schemaVersion !== 1 || JSON.stringify(manifest.sources) !== JSON.stringify(sources)) {
    throw new Error('Shared platform bundle is stale. Maintainer must run scripts/build-spec-runtime.mjs with matching local dependencies; do not substitute a separate Shell.');
  }
  for (const [file, digest] of Object.entries(manifest.assets)) {
    if (hash(await readFile(resolve(root, runtimePath, 'vendor', file))) !== digest) throw new Error(`Shared platform asset mismatch: ${file}`);
  }
  for (const required of ['ops-platform.js', 'ops-platform.css']) if (!manifest.assets[required]) throw new Error(`Missing shared platform asset: ${required}`);
  for (const required of ['PlatformShell.tsx', 'PlatformProvider.tsx', 'PlatformQueryForm.tsx', 'PlatformTable.tsx', 'PlatformTableToolbar.tsx', 'PlatformModule.tsx', 'modalDividers.tsx', 'shell.css']) {
    if (!manifest.sharedInputs.includes(`modules/operations/shell/${required}`)) throw new Error(`Shared platform component not bundled: ${required}`);
  }
  return manifest;
}
