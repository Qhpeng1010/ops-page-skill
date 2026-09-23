import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const DOMAIN_PATH = 'modules/operations/domain.json';
const POLICY_PATH = 'modules/operations/execution/generation-policy.json';
const RECIPE_PATH = 'modules/operations/execution/recipes/recipe-registry.json';
const PREFIXES = ['$ops-page-skill', '/ops:page'];
export const skillRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

async function readJson(root, path) {
  return JSON.parse(await readFile(resolve(root, path), 'utf8'));
}

export function stripInvocation(rawRequest) {
  const source = String(rawRequest ?? '').trim();
  const token = source.match(/^\S+/)?.[0] || '';
  if (PREFIXES.includes(token)) return { explicit: true, request: source.slice(token.length).trim(), command: token };
  if (token.startsWith('/ops:') || token.startsWith('$ops-')) {
    return { explicit: true, request: source.slice(token.length).trim(), command: token, unknown: true };
  }
  return { explicit: false, request: source, command: null };
}

function scoreIntent(request, intent) {
  const matches = intent.signals.filter(signal => request.includes(signal));
  if (!matches.length) return null;
  const length = matches.reduce((total, signal) => total + signal.length, 0);
  return { matches, score: length * 100 + (intent.priority || 0), longest: Math.max(...matches.map(signal => signal.length)) };
}

function hasStructuredFieldList(request) {
  const source = String(request ?? '');
  if (/(?:字段|参数|属性|筛选项|查询项|数据项|表格字段|表格列|table值|table字段|columns|fields)\s*[:：]/i.test(source)) return true;
  return /[:：]\s*[^。！？\n]{1,32}(?:、|,)[^。！？\n]{1,96}/.test(source);
}

export async function resolveOpsPageRoute(rawRequest, root = skillRoot) {
  const invocation = stripInvocation(rawRequest);
  const [domain, policy, recipeRegistry] = await Promise.all([
    readJson(root, DOMAIN_PATH),
    readJson(root, POLICY_PATH),
    readJson(root, RECIPE_PATH),
  ]);
  const directorRules = policy.directorRules || {};
  if (!invocation.request) {
    return { status: 'clarify', explicit: invocation.explicit, command: invocation.command, question: '请补充要生成的运营后台页面需求。' };
  }
  if (invocation.unknown) {
    return { status: 'unknown-command', command: invocation.command, supportedCommands: PREFIXES, question: `不支持快捷命令 ${invocation.command}，请使用 ${PREFIXES.join(' 或 ')}。` };
  }

  const candidates = domain.intents
    .map(intent => ({ intent, match: scoreIntent(invocation.request, intent) }))
    .filter(item => item.match)
    .sort((left, right) => right.match.score - left.match.score || right.match.longest - left.match.longest);
  const selected = candidates[0]?.intent;
  const family = selected?.family || policy.routing.defaultFamily;
  const familyPolicy = policy.families[family];
  const explicitReact = /(?:React|react)\s*(?:模式|源码|实现)|自定义 React|任意复杂能力/i.test(invocation.request);
  const complexSignals = /审批流程|工作台|数据看板|仪表盘|图表|多模块|自定义画布|拖拽编排|富文本编辑器|多页面流程|特殊动画|复杂联动|复杂组合|新标签页|独立页|独立地址|业务页签|关联用户|关联列表|权限列表|用户列表|关联数据|处理记录|沟通记录|操作记录|审核记录/i;
  const listLanguage = /查询|列表|管理|筛选|搜索|条件|表格|table值|表格字段|列|记录|清单|检索|过滤/i.test(invocation.request);
  const formTask = /新增|新建|创建|编辑|录入/i.test(invocation.request);
  const listLike = listLanguage || (hasStructuredFieldList(invocation.request) && !formTask);
  const commonList = (selected?.family === 'list' || listLike) && !complexSignals.test(invocation.request);
  const mode = explicitReact || !commonList
    ? 'react' : 'ops-page-spec';
  const modePolicy = policy.modes?.[mode] || {};
  const recipeMatches = recipeRegistry.recipes
    .map(recipe => {
      if (!recipe.modes.includes(mode)) return null;
      const matches = (recipe.match?.signals || []).filter(signal => invocation.request.includes(signal));
      const familyMatch = recipe.match?.mode === 'family-or-semantic' && listLike;
      if (!matches.length && !familyMatch) return null;
      return {
        id: recipe.id,
        label: recipe.label,
        capabilities: recipe.capabilities || [],
        presentation: recipe.presentation,
        matches: familyMatch ? ['页面族:list', ...matches] : matches,
        score: (familyMatch ? 100 : 0) + matches.reduce((total, signal) => total + signal.length, 0),
      };
    })
    .filter(Boolean)
    .sort((left, right) => right.score - left.score);
  const secondary = [];
  if (family === 'list' && /详情|查看/.test(invocation.request)) secondary.push('detail.overlay');
  if (family === 'list' && /新增|新建|创建/.test(invocation.request)) secondary.push('form.modal');
  if (family === 'custom') secondary.push('composition');
  const resources = {
    always: policy.knowledgeLoading.always,
    family: [familyPolicy.contextPack, familyPolicy.pagePattern],
    onDemand: [],
    generate: modePolicy.resources || domain.adapter.resources.generate,
    review: modePolicy.review || domain.adapter.resources.review
  };
  const hasOverlay = secondary.some(capability => capability.endsWith('.overlay') || capability.endsWith('.modal'));
  const needsCompositionRules = hasOverlay || /模块|新标签页|弹窗|抽屉|Modal|Drawer|子[页标]签|Tabs|步骤|工作台|组合/i.test(invocation.request);
  const needsInteractionRules = hasOverlay || family === 'form' || /审批|校验|验证|提交|保存|发布|下线|删除|禁用|异步|遮罩|关闭|恢复|重试|复杂|特殊|弹窗|抽屉|Modal|Drawer/i.test(invocation.request);
  if (/模块|新标签页/.test(invocation.request)) resources.onDemand.push(policy.onDemand.modulePage);
  if (needsCompositionRules || family === 'custom') resources.onDemand.push(directorRules.composition || policy.onDemand.compositionRules);
  if (needsInteractionRules) resources.onDemand.push(directorRules.interaction || policy.onDemand.interactionRules);
  if (family === 'custom') resources.onDemand.push(policy.onDemand.capabilities);
  const unique = values => [...new Set(values.filter(Boolean))];
  const loaded = new Set();
  for (const key of ['always', 'family', 'onDemand', 'generate']) {
    resources[key] = unique(resources[key]).filter(path => {
      if (loaded.has(path)) return false;
      loaded.add(path);
      return true;
    });
  }
  resources.review = unique(resources.review).filter(path => !loaded.has(path));
  return {
    status: 'routed',
    skillRoot: resolve(root),
    explicit: invocation.explicit,
    command: invocation.command,
    request: invocation.request,
    route: {
      intent: selected?.id || 'default-list',
      family,
      mode,
      modeReason: mode === 'ops-page-spec'
        ? '列表需求只包含查询、表格、分页及常见 Modal/Drawer，使用本地规格运行时'
        : explicitReact ? '用户明确要求 React 模式' : selected?.family !== 'list' ? '需求未命中常见列表意图，保留 React 的完整能力' : '需求包含规格模式未覆盖的复杂或自定义能力，使用 React',
      reason: selected ? `命中${selected.id}页面意图` : '未命中特殊意图，使用查询列表默认页面族',
      matches: candidates[0]?.match?.matches || [],
      recipes: recipeMatches.map(recipe => ({ id: recipe.id, label: recipe.label, matches: recipe.matches })),
    },
    mode,
    capabilities: unique([...(familyPolicy.capabilities || []), ...secondary, ...recipeMatches.flatMap(recipe => recipe.capabilities), ...(mode === 'ops-page-spec' ? ['ops-page-spec'] : ['react'])]),
    resources,
    commands: Object.fromEntries(Object.entries(domain.adapter.execution).filter(([name]) => name.endsWith('Command'))),
    boundaries: {
      sourceOfTruth: mode === 'ops-page-spec' ? 'page-spec.json' : 'page implementation plus page-spec.json',
      generatedFilesAreDerived: mode === 'ops-page-spec',
      browserAutomation: false,
      validationRequired: mode === 'ops-page-spec' ? policy.validation.opsPageSpecRequired : policy.validation.required,
      visualAcceptance: 'human'
    },
    reuse: policy.reuse
  };
}
