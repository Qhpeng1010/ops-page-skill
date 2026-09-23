#!/usr/bin/env node
import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import { basename, dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const skillRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function option(args, name) {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : '';
}

async function main() {
  const args = process.argv.slice(2);
  if (args.includes('--help')) {
    console.log('node scripts/scaffold-ops-page-spec.mjs --out changes/{change-id} --request-file {request-file}');
    return;
  }
  const output = option(args, '--out');
  const requestFile = option(args, '--request-file');
  if (!output || !requestFile) throw new Error('Use --out and --request-file; see --help.');

  const out = resolve(skillRoot, output);
  const request = await readFile(resolve(requestFile), 'utf8');
  if (!request.trim()) throw new Error('Request file must not be empty.');
  try { await access(out); throw new Error(`Change already exists: ${out}`); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }

  const changeId = basename(out);
  await mkdir(out, { recursive: true });
  await writeFile(resolve(out, 'request.txt'), request);
  await writeFile(resolve(out, 'page-spec.json.request'), request);
  await writeFile(resolve(out, '.gitignore'), 'dist/\nnode_modules/\n');
  await writeFile(resolve(out, 'page-spec.json'), `${JSON.stringify({
    schemaVersion: 1,
    status: 'draft',
    runtime: 'ops-page-spec',
    metadata: { changeId, title: '待按需求确定', family: 'list', request },
    shell: { projectKey: 'platform-settings', projectName: '平台配置', group: '页面', pageKey: 'pending', brand: '运营管理平台' },
    list: {
      query: { fields: [{ key: 'keyword', label: '关键词', control: 'input' }] },
      table: { rowKey: 'id', title: '待生成列表', columns: [{ key: 'id', title: 'ID' }], rows: [] },
    },
  }, null, 2)}\n`);
  console.log(`Created ${out}`);
  console.log('Next: complete page-spec.json, set status to ready, validate it, then run build-ops-page-spec.mjs.');
  console.log(`Preview output: ${resolve(out, 'preview.html')}`);
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  main().catch(error => { console.error(`Ops Page Spec scaffold failed: ${error.message}`); process.exitCode = 1; });
}
