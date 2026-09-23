import { access, readdir, readFile } from 'node:fs/promises';
import { dirname, join, resolve, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { verifySpecRuntime } from './lib/spec-runtime-integrity.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];
const json = async path => JSON.parse(await readFile(join(root, path), 'utf8'));
async function exists(path) { try { await access(path); } catch { errors.push(`Missing resource: ${path}`); } }
async function scan(folder) {
  for (const entry of await readdir(folder, { withFileTypes: true })) {
    if (['node_modules', 'dist', '.git', 'changes', '.cache', 'preview-assets'].includes(entry.name)) continue;
    const path = join(folder, entry.name);
    if (entry.isDirectory()) { await scan(path); continue; }
    if (extname(path) === '.json') {
      try { JSON.parse(await readFile(path, 'utf8')); } catch (error) { errors.push(`${path}: ${error.message}`); }
    }
    if (extname(path) === '.md') {
      const contents = await readFile(path, 'utf8');
      for (const match of contents.matchAll(/\]\(([^)]+)\)/g)) {
        const target = match[1].split('#')[0];
        if (!target || /^[a-z]+:/i.test(target)) continue;
        await exists(resolve(dirname(path), decodeURIComponent(target)));
      }
    }
  }
}
try {
  await scan(root);
  await verifySpecRuntime(root);
  const index = await json('modules/operations/rules-index.json');
  for (const path of [...index.always, ...Object.values(index.pagePatterns), ...Object.values(index.onDemand), ...Object.values(index.contextPacks ?? {})]) await exists(join(root, path));
  for (const [name, path] of Object.entries(index.directorRules ?? {})) {
    if (typeof path !== 'string' || !path.trim()) errors.push(`Invalid director rule path: ${name}`);
    else await exists(join(root, path));
  }
  const domain = await json('modules/operations/domain.json');
  const policy = await json('modules/operations/execution/generation-policy.json');
  if (domain.version !== 1 || domain.module !== 'operations') errors.push('operations domain must use version 1');
  if (policy.schemaVersion !== 1 || policy.system !== 'operations') errors.push('operations generation policy must use schemaVersion 1');
  if (policy.knowledgeLoading?.mode !== 'progressive') errors.push('knowledgeLoading.mode must be progressive');
  if (!Number.isInteger(policy.performance?.standardOpsPageSpecTargetSeconds) || policy.performance.standardOpsPageSpecTargetSeconds <= 0 || policy.performance.standardOpsPageSpecTargetSeconds > 420) {
    errors.push('performance.standardOpsPageSpecTargetSeconds must be an integer between 1 and 420');
  }
  if (policy.performance?.rerun !== 'only after failure or input change') errors.push('performance.rerun must limit reruns to failures or input changes');
  if (JSON.stringify(policy.knowledgeLoading?.always ?? []) !== JSON.stringify(domain.adapter?.resources?.always ?? [])) errors.push('domain and generation policy always resources are out of sync');
  for (const name of ['visual', 'composition', 'interaction']) {
    if (policy.directorRules?.[name] !== index.directorRules?.[name]) errors.push(`director rule index and generation policy are out of sync: ${name}`);
  }
  if (!policy.knowledgeLoading?.always?.includes(index.directorRules?.visual)) errors.push('visual director rule must be an always resource');
  if (!policy.onDemand?.compositionRules || !policy.onDemand?.interactionRules) errors.push('composition and interaction director rules must have onDemand aliases');
  const policyResources = [
    ...(policy.knowledgeLoading?.always ?? []),
    ...Object.values(policy.directorRules ?? {}),
    ...Object.values(policy.families ?? {}).flatMap(item => [item.contextPack, item.pagePattern]),
    ...Object.values(policy.onDemand ?? {}),
    ...(domain.adapter?.resources?.generate ?? []),
    ...(domain.adapter?.resources?.review ?? []),
    ...Object.values(policy.modes ?? {}).flatMap(mode => mode.resources ?? []),
    ...Object.values(policy.modes ?? {}).flatMap(mode => mode.review ?? []),
    ...Object.values(policy.modes ?? {}).map(mode => mode.runtime).filter(Boolean),
    ...Object.values(policy.modes ?? {}).map(mode => mode.vendor).filter(Boolean)
  ];
  for (const path of policyResources) {
    const target = join(root, path);
    await exists(target);
    if (path.endsWith('/')) {
      try {
        const entries = await readdir(target);
        if (!entries.length) errors.push(`Runtime vendor directory is empty: ${path}`);
      } catch { /* exists() already recorded the missing directory */ }
    }
  }
  for (const path of [
    ...(domain.adapter?.execution?.shell?.sources ?? []),
    ...(domain.adapter?.execution?.shell?.assets ?? [])
  ]) await exists(join(root, 'modules/operations/shell', path));
  const familyIds = new Set(Object.keys(policy.families ?? {}));
  for (const intent of domain.intents ?? []) {
    if (!intent.id || !familyIds.has(intent.family) || !Array.isArray(intent.signals) || !intent.signals.length) {
      errors.push(`Invalid operations route intent: ${intent.id || 'missing'}`);
    }
  }
  for (const key of ['dispatchCommand', 'scaffoldCommand', 'prepareCommand', 'buildCommand', 'validateCommand', 'specScaffoldCommand', 'specBuildCommand', 'specValidateCommand', 'finishCommand', 'checkCommand']) {
    if (typeof domain.adapter?.execution?.[key] !== 'string' || !domain.adapter.execution[key].trim()) errors.push(`Missing operations execution command: ${key}`);
  }
  for (const mode of ['ops-page-spec', 'react']) {
    if (!policy.modes?.[mode]?.purpose || !Array.isArray(policy.modes[mode].families)) errors.push(`Missing generation mode: ${mode}`);
  }
  const config = await json('modules/operations/platform.config.json');
  if (config.schemaVersion !== 1) errors.push('Unsupported platform schemaVersion');
  if (!['light', 'dark'].includes(config.appearance)) errors.push('appearance must be light/dark');
  if (!['default', 'compact'].includes(config.density)) errors.push('density must be default/compact');
  if (!['small', 'middle', 'large'].includes(config.componentSize)) errors.push('componentSize must be small/middle/large');
  if (!Number.isFinite(config.layout?.elementGap) || config.layout.elementGap <= 0) errors.push('layout.elementGap must be positive');
  if (!Number.isFinite(config.layout?.buttonGap) || config.layout.buttonGap <= 0) errors.push('layout.buttonGap must be positive');
  for (const key of ['newTabPadding', 'newTabModuleGap', 'moduleDetailRowGap', 'tableToolbarGap', 'detailTitleGap', 'modalDividerGap']) {
    if (!Number.isFinite(config.layout?.[key]) || config.layout[key] <= 0) errors.push(`layout.${key} must be positive`);
  }
  if (typeof config.layout?.newTabBackground !== 'string' || !config.layout.newTabBackground.trim()) errors.push('layout.newTabBackground must be a nonempty string');
  if (typeof config.layout?.queryDividerColor !== 'string' || !config.layout.queryDividerColor.trim()) errors.push('layout.queryDividerColor must be a nonempty string');
  if (typeof config.layout?.modalDividerColor !== 'string' || !config.layout.modalDividerColor.trim()) errors.push('layout.modalDividerColor must be a nonempty string');
  if (!config.brand?.name?.trim() || typeof config.brand.logoUrl !== 'string') errors.push('brand name and logoUrl required');
  if (typeof config.brand?.collapsedLogoUrl !== 'string') errors.push('brand.collapsedLogoUrl must be a string');
  if (!Number.isFinite(config.brand?.logoHeight) || config.brand.logoHeight <= 0) errors.push('brand.logoHeight must be positive');
  if (!Number.isFinite(config.brand?.dividerHeight) || config.brand.dividerHeight <= 0) errors.push('brand.dividerHeight must be positive');
  if (!Array.isArray(config.projects) || !config.projects.length) errors.push('projects must be a nonempty array');
  else {
    const projectKeys = new Set();
    for (const project of config.projects) {
      if (typeof project.key !== 'string' || !project.key.trim() || projectKeys.has(project.key)) errors.push('Project keys must be nonempty and unique');
      if (typeof project.name !== 'string' || !project.name.trim()) errors.push('Project names must be nonempty');
      projectKeys.add(project.key);
    }
  }
  for (const filename of ['易宝支付:展开.svg', '易宝支付:收起.svg']) await exists(join(root, 'modules/operations/shell', filename));
  for (const key of ['sidebarWidth', 'collapsedWidth', 'headerHeight', 'tabsHeight', 'tabsFontSize', 'tabsDotSize', 'tabsCloseIconScale', 'projectPanelWidth', 'projectPanelHeightPercent', 'projectPanelFontSize', 'contentPadding']) {
    if (!Number.isFinite(config.shell?.[key]) || config.shell[key] <= 0) errors.push(`shell.${key} must be positive`);
  }
  if (config.shell.collapsedWidth >= config.shell.sidebarWidth) errors.push('collapsedWidth must be smaller than sidebarWidth');
  if (config.shell.projectPanelHeightPercent > 100) errors.push('shell.projectPanelHeightPercent must not exceed 100');
  if (!Number.isFinite(config.shell.tabsBorderRadius) || config.shell.tabsBorderRadius < 0) errors.push('shell.tabsBorderRadius must be nonnegative');
  if (!Number.isFinite(config.shell.tabsGap) || config.shell.tabsGap < 0) errors.push('shell.tabsGap must be nonnegative');
  if (typeof config.shell.projectPanelBackground !== 'string' || !config.shell.projectPanelBackground.trim()) errors.push('shell.projectPanelBackground must be a nonempty string');
  if (typeof config.shell.userName !== 'string' || !config.shell.userName.trim()) errors.push('shell.userName must be a nonempty string');
  if (typeof config.shell.showTabs !== 'boolean') errors.push('shell.showTabs must be boolean');
  if (!config.theme?.token || !config.theme?.components) errors.push('theme.token and theme.components required');
  const registry = await json('modules/operations/execution/capability-model/capability-registry.json');
  const ids = new Set();
  for (const capability of registry.capabilities) {
    if (!capability.id || ids.has(capability.id)) errors.push(`Duplicate/missing capability id: ${capability.id}`);
    ids.add(capability.id);
    if (!['guidance', 'example', 'extension'].includes(capability.status)) errors.push(`Unknown capability status: ${capability.id}`);
    if (capability.status === 'example' && !capability.source) errors.push(`Example needs source: ${capability.id}`);
    for (const path of [capability.source, capability.reference].filter(Boolean)) await exists(join(root, path));
  }
  const recipes = await json('modules/operations/execution/recipes/recipe-registry.json');
  if (recipes.schemaVersion !== 1) errors.push('recipe registry must use schemaVersion 1');
  if (recipes.strategy !== 'composable-semantic-suggestions') errors.push('recipe registry must use composable semantic suggestions');
  if (!Array.isArray(recipes.recipes) || !recipes.recipes.length) errors.push('recipe registry must contain recipes');
  else {
    const recipeIds = new Set();
    for (const recipe of recipes.recipes) {
      if (typeof recipe.id !== 'string' || !recipe.id.trim() || recipeIds.has(recipe.id)) errors.push(`Duplicate/missing recipe id: ${recipe.id || 'missing'}`);
      recipeIds.add(recipe.id);
      if (typeof recipe.label !== 'string' || !recipe.label.trim()) errors.push(`Recipe label required: ${recipe.id || 'missing'}`);
      if (!Array.isArray(recipe.families) || !recipe.families.length) errors.push(`Recipe families required: ${recipe.id || 'missing'}`);
      if (!Array.isArray(recipe.modes) || !recipe.modes.length) errors.push(`Recipe modes required: ${recipe.id || 'missing'}`);
      if (!['family-or-semantic', 'semantic'].includes(recipe.match?.mode)) errors.push(`Recipe match mode invalid: ${recipe.id || 'missing'}`);
      if (!Array.isArray(recipe.match?.signals) || !recipe.match.signals.length) errors.push(`Recipe signals required: ${recipe.id || 'missing'}`);
      if (!Array.isArray(recipe.capabilities) || !recipe.capabilities.length) errors.push(`Recipe capabilities required: ${recipe.id || 'missing'}`);
    }
  }
  if (errors.length) throw new Error(errors.join('\n'));
  console.log('Skill resources, local links, JSON, platform settings and capability references passed. Ant API types and UI behavior require a preview build.');
} catch (error) { console.error(error.message); process.exitCode = 1; }
