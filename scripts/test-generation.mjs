import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtemp, mkdir, readFile, writeFile, cp, lstat, readdir, rm } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveOpsPageRoute } from './lib/ops-page-routing.mjs';
import { dependencyIdentity, preparePreview, runInstall } from './prepare-preview.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
async function temporary(t) {
  const dir = await mkdtemp(resolve(tmpdir(), 'ops-generation-test-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  return dir;
}
function command(script, args, cwd) {
  const result = spawnSync(process.execPath, [resolve(root, 'scripts', script), ...args], { cwd, encoding: 'utf8', timeout: 10000 });
  assert.equal(result.status, 0, result.stderr || result.error?.message);
  return result.stdout;
}
async function manifest(dir, extra = {}) {
  await mkdir(dir, { recursive: true });
  await writeFile(resolve(dir, 'package.json'), JSON.stringify({ name: 'fixture', dependencies: { react: '19.2.0' }, ...extra }));
  await writeFile(resolve(dir, 'pnpm-lock.yaml'), 'lockfileVersion: 9.0\n');
}
// Lightweight package fixtures exercise cache control flow, not actual third-party package installation.
async function packages(dir) {
  for (const name of ['react', 'react-dom', 'antd', '@ant-design/icons', 'typescript', 'vite']) {
    const pkg = resolve(dir, 'node_modules', name);
    await mkdir(pkg, { recursive: true });
    await writeFile(resolve(pkg, 'package.json'), '{}');
  }
  await mkdir(resolve(dir, 'node_modules/vite/bin'), { recursive: true });
  await writeFile(resolve(dir, 'node_modules/vite/bin/vite.js'), 'console.log("vite fixture");');
}
test('routing includes overlay rules only when needed and preserves arbitrary working directories', async t => {
  const simple = await resolveOpsPageRoute('查询列表');
  assert.equal(simple.mode, 'ops-page-spec');
  assert.deepEqual(simple.capabilities, ['query', 'table', 'pagination', 'ops-page-spec']);
  assert.equal(simple.resources.onDemand.length, 0);
  assert(simple.route.recipes.some(recipe => recipe.id === 'management-list'));
  const full = await resolveOpsPageRoute('公告查询列表，支持新增和查看详情');
  assert.equal(full.mode, 'ops-page-spec');
  assert(full.capabilities.includes('form.modal'));
  assert(full.capabilities.includes('detail.overlay'));
  assert(full.resources.onDemand.some(path => path.endsWith('02-page-composition.md')));
  assert(full.resources.onDemand.some(path => path.endsWith('03-interaction-quality.md')));
  assert(full.route.recipes.some(recipe => recipe.id === 'detail-drawer'));
  assert(full.route.recipes.some(recipe => recipe.id === 'form-modal'));
  const all = ['always', 'family', 'onDemand', 'generate'].flatMap(key => full.resources[key]);
  assert.equal(new Set(all).size, all.length);
  const dir = await temporary(t);
  const request = resolve(dir, 'request.txt');
  await writeFile(request, '公告查询列表，支持新增和查看详情');
  const routed = JSON.parse(command('dispatch-ops-page-command.mjs', ['--request-file', request], dir));
  assert.equal(routed.skillRoot, root);
  assert.deepEqual(routed.resources, full.resources);
});
test('complex requests stay on React while explicit React remains available', async () => {
  const complex = await resolveOpsPageRoute('订单工作台，包含图表、审批流程和多模块联动');
  assert.equal(complex.mode, 'react');
  const explicit = await resolveOpsPageRoute('用户查询列表，使用 React 模式实现');
  assert.equal(explicit.mode, 'react');
  const custom = await resolveOpsPageRoute('制作一个订单编排器');
  assert.equal(custom.mode, 'react');
});
test('natural-language field lists use the fast shared ops-page-spec route', async () => {
  const routed = await resolveOpsPageRoute('生成一个账号管理页面，条件：时间、账号名称、新增人、账号角色、渠道等级；table值：账号名称、账号等级、账号角色、渠道等级、操作');
  assert.equal(routed.mode, 'ops-page-spec');
  assert(routed.capabilities.includes('ops-page-spec'));
  assert(routed.resources.onDemand.includes('modules/operations/design-system/director-rules/03-interaction-quality.md'));
});

test('structured field lists route to the list recipe without a business-object keyword', async () => {
  const routed = await resolveOpsPageRoute('页面字段：时间、名称、编号、渠道等级；操作：查看、启用');
  assert.equal(routed.mode, 'ops-page-spec');
  assert(routed.route.recipes.some(recipe => recipe.id === 'management-list'));
  assert(routed.route.recipes.some(recipe => recipe.id === 'row-action-confirm'));
});

test('semantic recipes compose without fixing business field names or presentation', async () => {
  const arbitrary = await resolveOpsPageRoute('时间、代理商名称、渠道等级；表格列：代理商名称、代理商等级；查看详情、禁用');
  assert.equal(arbitrary.mode, 'ops-page-spec');
  assert(arbitrary.route.recipes.some(recipe => recipe.id === 'management-list'));
  assert(arbitrary.route.recipes.some(recipe => recipe.id === 'detail-drawer'));
  assert(arbitrary.route.recipes.some(recipe => recipe.id === 'row-action-confirm'));
  const workspace = await resolveOpsPageRoute('新增代理商，打开新标签页编辑，字段：名称、编号、渠道等级');
  assert.equal(workspace.mode, 'react');
  assert(workspace.route.recipes.some(recipe => recipe.id === 'workspace-tab'));
  assert(workspace.route.recipes.some(recipe => recipe.id === 'form-modal'));
  assert(!workspace.route.recipes.some(recipe => recipe.id === 'management-list'));
});

test('additional recipes cover batch list tools and multi-module workspaces', async () => {
  const batch = await resolveOpsPageRoute('订单列表支持勾选、批量导出和批量启用');
  assert.equal(batch.mode, 'ops-page-spec');
  assert(batch.route.recipes.some(recipe => recipe.id === 'batch-tools'));
  const modules = await resolveOpsPageRoute('代理商工作区包含多模块和关联信息');
  assert.equal(modules.mode, 'react');
  assert(modules.route.recipes.some(recipe => recipe.id === 'multi-module-workspace'));
});

test('related users and permission lists use React when the spec runtime cannot express nested detail data', async () => {
  const routed = await resolveOpsPageRoute('角色权限管理列表，点击查看详情展示关联用户和权限列表');
  assert.equal(routed.mode, 'react');
  assert(routed.route.recipes.some(recipe => recipe.id === 'management-list'));
  assert(routed.route.recipes.some(recipe => recipe.id === 'detail-drawer'));
});

test('detail activity records use React while retaining composable list recipes', async () => {
  const routed = await resolveOpsPageRoute('客服工单管理，支持新增，详情展示处理记录和沟通记录');
  assert.equal(routed.mode, 'react');
  assert(routed.route.recipes.some(recipe => recipe.id === 'management-list'));
  assert(routed.route.recipes.some(recipe => recipe.id === 'form-modal'));
  assert(routed.route.recipes.some(recipe => recipe.id === 'detail-drawer'));
});
test('new scaffold stays clean, preserves the request and refuses an existing Change', async t => {
  const dir = await temporary(t);
  const request = resolve(dir, 'request.txt');
  const original = '公告查询\n支持新增和详情\n';
  await writeFile(request, original);
  const target = resolve(dir, 'page');
  command('scaffold-page.mjs', ['--out', target, '--request-file', request], dir);
  assert.equal(await readFile(resolve(target, 'request.txt'), 'utf8'), original);
  assert.equal(JSON.parse(await readFile(resolve(target, 'page-spec.json'), 'utf8')).request, original);
  assert.deepEqual(await readdir(resolve(target, 'src/data')), []);
  assert(!(await readFile(resolve(target, 'src/pages.tsx'), 'utf8')).includes('Merchant'));
  assert(!JSON.stringify(await readdir(target, { recursive: true })).includes('.DS_Store'));
  const again = spawnSync(process.execPath, [resolve(root, 'scripts/scaffold-page.mjs'), '--out', target, '--request-file', request], { encoding: 'utf8' });
  assert.notEqual(again.status, 0);
  command('scaffold-page.mjs', ['--out', resolve(dir, 'example'), '--request-file', request, '--with-examples'], dir);
  assert((await readFile(resolve(dir, 'example/src/pages.tsx'), 'utf8')).includes('Merchant'));
});
test('ops-page-spec scaffold and build stay local and dependency-free', async t => {
  const dir = await temporary(t);
  const request = resolve(dir, 'request.txt');
  await writeFile(request, '生成一个用户查询列表，支持新增和查看详情');
  const target = resolve(dir, 'spec-change');
  command('scaffold-ops-page-spec.mjs', ['--out', target, '--request-file', request], dir);
  const specPath = resolve(target, 'page-spec.json');
  assert.equal(await readFile(resolve(target, 'page-spec.json.request'), 'utf8'), '生成一个用户查询列表，支持新增和查看详情');
  const spec = JSON.parse(await readFile(specPath, 'utf8'));
  spec.status = 'ready';
  spec.metadata.title = '用户管理';
  spec.shell.pageKey = 'users';
  spec.list.table = {
    rowKey: 'id', title: '用户列表', columns: [
      { key: 'id', title: '用户ID' }, { key: 'amount', title: '金额', format: 'amount', unit: '元' },
    ], rows: [{ id: 'U001', amount: 12.5 }],
    detail: { title: '用户详情', groups: [{ key: 'basic', title: '基本信息', fields: [{ key: 'id', label: '用户ID' }] }] },
  };
  await writeFile(specPath, `${JSON.stringify(spec, null, 2)}\n`);
  command('validate-ops-page-spec.mjs', [specPath], dir);
  command('build-ops-page-spec.mjs', ['--spec', specPath], dir);
  const preview = await readFile(resolve(target, 'preview.html'), 'utf8');
  assert(preview.includes('./preview-assets/ops-page-spec-runtime.js'));
  assert(!/https?:\/\//i.test(preview));
  const inlineSpec = preview.match(/window\.\__OPS_PAGE_SPEC__=(.*);<\/script>/)?.[1];
  assert(inlineSpec);
  assert.equal(JSON.parse(inlineSpec).metadata.title, '用户管理');
  assert((await readFile(resolve(target, 'preview-assets/vendor/ops-platform.js'), 'utf8')).length > 1000);
  const config = JSON.parse(preview.match(/window\.__OPS_PLATFORM_CONFIG__=(.*);<\/script>/)[1]);
  assert.equal(config.shell.sidebarWidth, 205);
  assert.equal(config.theme.token.fontWeightStrong, 500);
  assert.equal(config.theme.components.Table.fontWeightStrong, 500);
  assert((await readFile(resolve(target, 'preview-assets/ops-page-spec.css'), 'utf8')).includes('font-weight: var(--ops-strong-font-weight, 500)'));
  assert((await readFile(resolve(target, 'preview-assets/vendor/ops-platform.css'), 'utf8')).includes('font-weight:var(--ops-strong-font-weight, 500)'));
  assert.equal(config.projects.length, 1);
  const build = JSON.parse(await readFile(resolve(target, 'ops-page-spec-build.json'), 'utf8'));
  assert.equal(build.sharedFramework, 'modules/operations/shell/');
  assert.match(build.platformVersions.antd, /^6\./);
  assert(!((await readdir(target)).includes('node_modules')));
  for (const match of preview.matchAll(/(?:src|href)="(\.\/preview-assets\/[^"]+)"/g)) await readFile(resolve(target, match[1]));
  command('finish-ops-page.mjs', ['--change', target], dir);
  spec.status = 'draft';
  await writeFile(specPath, JSON.stringify(spec));
  const invalid = spawnSync(process.execPath, [resolve(root, 'scripts/build-ops-page-spec.mjs'), '--spec', specPath], { encoding: 'utf8' });
  assert.notEqual(invalid.status, 0);
  assert.equal(await readFile(resolve(target, 'preview.html'), 'utf8'), preview);
});
test('cache identity ignores dependency order but separates changed locks', async t => {
  const dir = await temporary(t), a = resolve(dir, 'a'), b = resolve(dir, 'b');
  await manifest(a, { dependencies: { react: '19', antd: '6' } });
  await manifest(b, { dependencies: { antd: '6', react: '19' } });
  assert.equal((await dependencyIdentity(a)).key, (await dependencyIdentity(b)).key);
  await writeFile(resolve(b, 'pnpm-lock.yaml'), 'lockfileVersion: 9.0\n# changed');
  assert.notEqual((await dependencyIdentity(a)).key, (await dependencyIdentity(b)).key);
});
test('matching cache is reused across new projects; changed linked input fails without mutation', async t => {
  const dir = await temporary(t), skill = resolve(dir, 'skill'), a = resolve(dir, 'a'), b = resolve(dir, 'b');
  await manifest(a); await manifest(b);
  const cache = resolve(skill, '.cache/dependencies', (await dependencyIdentity(a)).key);
  await manifest(cache); await packages(cache);
  assert.equal((await preparePreview(a, { root: skill })).source, 'shared-cache');
  assert.equal((await preparePreview(b, { root: skill })).source, 'shared-cache');
  assert.equal((await preparePreview(a, { root: skill })).source, 'existing');
  await writeFile(resolve(a, 'pnpm-lock.yaml'), 'different lock');
  await assert.rejects(preparePreview(a, { root: skill }), /no longer matches/);
  assert.equal(await readFile(resolve(cache, 'pnpm-lock.yaml'), 'utf8'), 'lockfileVersion: 9.0\n');
  assert((await lstat(resolve(b, 'node_modules'))).isSymbolicLink());
});
test('cold preparation seeds skill cache once and does not reuse a failed install', async t => {
  const dir = await temporary(t), skill = resolve(dir, 'skill'), a = resolve(dir, 'a'), b = resolve(dir, 'b');
  await manifest(a); await manifest(b);
  const seed = resolve(dir, 'seed'); await packages(seed);
  const bin = resolve(dir, 'bin'); await mkdir(bin);
  const installer = resolve(bin, 'pnpm');
  await writeFile(installer, `#!${process.execPath}\nconst fs=require('node:fs');fs.cpSync(${JSON.stringify(resolve(seed, 'node_modules'))},'node_modules',{recursive:true});fs.appendFileSync(${JSON.stringify(resolve(dir, 'installs'))},'1');`, { mode: 0o755 });
  const previousPath = process.env.PATH;
  process.env.PATH = `${bin}:${previousPath}`;
  try {
    assert.equal((await preparePreview(a, { root: skill })).source, 'installed-cache');
    assert.equal((await preparePreview(b, { root: skill })).source, 'shared-cache');
    assert.equal(await readFile(resolve(dir, 'installs'), 'utf8'), '1');
    await writeFile(installer, `#!${process.execPath}\nprocess.exit(3);`, { mode: 0o755 });
    const c = resolve(dir, 'c'); await manifest(c, { dependencies: { react: '20' } });
    await assert.rejects(preparePreview(c, { root: skill }), /exited with code 3/);
    await assert.rejects(lstat(resolve(c, 'node_modules')), { code: 'ENOENT' });
    assert(!(await readdir(resolve(skill, '.cache/dependencies'))).some(name => name.endsWith('.prepare-lock')));
  } finally { process.env.PATH = previousPath; }
});
test('installer has a real total-process deadline', async t => {
  const dir = await temporary(t);
  const started = performance.now();
  await assert.rejects(runInstall(process.execPath, ['-e', 'setInterval(()=>{},1000)'], dir, 100), /exceeded/);
  assert(performance.now() - started < 3000);
});
