#!/usr/bin/env node
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { readFile } from 'node:fs/promises';
import { resolveOpsPageRoute } from './lib/ops-page-routing.mjs';

const args = process.argv.slice(2);
function arg(name) {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : '';
}

export async function dispatchOpsPageCommand({ request, root }) {
  return resolveOpsPageRoute(request, root);
}

async function main() {
  const requestFile = arg('--request-file');
  if (requestFile && arg('--request')) throw new Error('Use either --request or --request-file.');
  const request = requestFile ? await readFile(resolve(requestFile), 'utf8') : arg('--request');
  if (!request.trim()) throw new Error('Usage: node dispatch-ops-page-command.mjs --request-file <request.txt> | --request "<request>" [--text]');
  const result = await dispatchOpsPageCommand({ request });
  if (args.includes('--text')) {
    console.log(`ops-page-command: ${result.status}`);
    if (result.route) console.log(`- family: ${result.route.family}`);
    if (result.mode) console.log(`- mode: ${result.mode} (${result.route?.modeReason || 'route decision'})`);
    if (result.route?.matches?.length) console.log(`- matched: ${result.route.matches.join('、')}`);
    if (result.route?.recipes?.length) console.log(`- recipes: ${result.route.recipes.map(recipe => recipe.label).join('、')}`);
    if (result.resources) console.log(`- progressive resources: always ${result.resources.always.length}, family ${result.resources.family.length}, onDemand ${result.resources.onDemand.length}`);
    if (result.question) console.log(`- ${result.question}`);
    return;
  }
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  main().catch(error => { console.error(`ops-page-command: failed\n- ${error.message}`); process.exitCode = 1; });
}
