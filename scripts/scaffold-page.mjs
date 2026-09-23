import { cp, mkdir, readFile, writeFile, access } from 'node:fs/promises';
import { basename, dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
async function main() {
  const rawArgs = process.argv.slice(2);
  const withExamples = rawArgs.includes('--with-examples');
  const args = rawArgs.filter(arg => arg !== '--with-examples');
  if (args.includes('--help')) {
    console.log('node scaffold-page.mjs --out <new-directory> --request-file <utf8-text-file> [--with-examples]');
    return;
  }
  const options = {};
  for (let index = 0; index < args.length; index += 2) {
    if (!['--out', '--request-file'].includes(args[index]) || !args[index + 1] || options[args[index]]) {
      throw new Error('Use --out and --request-file once each; see --help.');
    }
    options[args[index]] = args[index + 1];
  }
  if (!options['--out'] || !options['--request-file']) throw new Error('--out and --request-file are required.');
  // Relative Change paths are always rooted at this skill so the result is
  // discoverable next to the skill even when the command is invoked elsewhere.
  const out = resolve(root, options['--out']);
  const request = await readFile(resolve(options['--request-file']), 'utf8');
  if (!request.trim()) throw new Error('Request file must not be empty.');
  try { await access(out); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  // mkdir without recursive is the final atomic refusal to replace an existing directory.
  await mkdir(dirname(out), { recursive: true });
  await mkdir(out);
  const template = join(root, 'assets/frontend-template');
  await cp(template, out, { recursive: true, force: false, filter: source => {
    if (['.DS_Store', 'node_modules', 'dist', 'preview-assets', '.git', '.cache'].includes(basename(source))) return false;
    return withExamples || ![join(template, 'src/pages.tsx'), join(template, 'src/data')].includes(source);
  } });
  if (!withExamples) {
    await mkdir(join(out, 'src/data'), { recursive: true });
    await writeFile(join(out, 'src/pages.tsx'), `import type { PlatformPage } from './platform/PlatformShell';\n\n// Replace this draft with the requested business pages; page-spec.json must also be completed.\nexport const pages: PlatformPage[] = [{ key: 'pending', title: '待生成', group: '页面', render: () => null }];\n`);
  }
  const platform = join(out, 'src/platform');
  await mkdir(platform, { recursive: true });
  for (const filename of ['PlatformProvider.tsx', 'PlatformShell.tsx', 'PlatformModule.tsx', 'PlatformQueryForm.tsx', 'PlatformTable.tsx', 'PlatformTableToolbar.tsx', 'PlatformTableValue.tsx', 'modalDividers.tsx', 'shell.css']) {
    await cp(join(root, 'modules/operations/shell', filename), join(platform, filename));
  }
  for (const [source, destination] of [['易宝支付:展开.svg', 'logo-expanded.svg'], ['易宝支付:收起.svg', 'logo-collapsed.svg']]) {
    await cp(join(root, 'modules/operations/shell', source), join(platform, destination));
  }
  await cp(join(root, 'modules/operations/platform.config.json'), join(platform, 'platform.config.json'));
  await writeFile(join(out, 'request.txt'), request);
  await writeFile(join(out, 'page-spec.json'), JSON.stringify({
    schemaVersion: 1, status: 'draft', request, title: '待按需求确定', family: 'custom', dataMode: 'mock',
    regions: [], actions: [], assumptions: ['初始化示例，尚未根据需求生成业务页面；未接入后端'], decisions: [], extensions: {},
  }, null, 2) + '\n');
  console.log(`Created ${out}\nNext: implement src/pages.tsx and src/data/, and complete page-spec.json. Only public Shell and project setup are reused.\nRun prepare-preview.mjs once, then the required contract, skill and build checks. Output: ${join(out, 'preview.html')}.\nThis draft is not a completed page; browser checks are manual.`);
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
