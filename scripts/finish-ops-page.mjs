#!/usr/bin/env node
import { access, readFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const node = process.execPath;

function option(args, name) {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : '';
}

function runScript(script, args, cwd) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(node, [resolve(root, 'scripts', script), ...args], { cwd, stdio: 'inherit' });
    child.once('error', reject);
    child.once('exit', code => {
      if (code === 0) resolvePromise();
      else reject(new Error(script + ' failed with code ' + (code ?? 'unknown')));
    });
  });
}

async function main() {
  const args = process.argv.slice(2);
  if (args.includes('--help')) {
    console.log('node scripts/finish-ops-page.mjs --change <change-directory> [--allow-network]');
    return;
  }
  const changeArg = option(args, '--change');
  if (!changeArg) throw new Error('Use --change <change-directory>; see --help.');
  const change = resolve(changeArg);
  const specPath = resolve(change, 'page-spec.json');
  await access(specPath);
  const spec = JSON.parse(await readFile(specPath, 'utf8'));
  const opsSpec = spec.runtime === 'ops-page-spec';
  const checks = opsSpec
    ? [
        ['validate-ops-page-spec.mjs', [specPath]],
        ['check-skill.mjs', []],
      ]
    : [
        ['validate-page-spec.mjs', [specPath]],
        ['check-skill.mjs', []],
      ];

  await Promise.all(checks.map(([script, scriptArgs]) => runScript(script, scriptArgs, root)));
  if (opsSpec) {
    await runScript('build-ops-page-spec.mjs', ['--spec', specPath], root);
  } else {
    const prepareArgs = ['--project', change];
    if (args.includes('--allow-network')) prepareArgs.push('--allow-network');
    await runScript('prepare-preview.mjs', prepareArgs, root);
    await runScript(resolve(change, 'scripts/build-preview.mjs'), [], change);
  }
  console.log('Finished ' + (opsSpec ? 'ops-page-spec' : 'React') + ' Change: ' + change);
}

main().catch(error => {
  console.error('Ops Page finish failed: ' + error.message);
  process.exitCode = 1;
});
