import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const text = value => typeof value === 'string' && value.trim().length > 0;
export function validateSpec(spec) {
  const errors = [];
  if (!object(spec)) return ['spec must be an object'];
  if (spec.schemaVersion !== 1) errors.push('schemaVersion must be 1');
  if (spec.status !== 'ready') errors.push('status must be ready; draft scaffold is not deliverable');
  for (const key of ['request', 'title', 'family']) if (!text(spec[key])) errors.push(`${key} must be nonempty text`);
  if (!['mock', 'connected', 'static'].includes(spec.dataMode)) errors.push('invalid dataMode');
  const regionIds = new Set();
  if (!Array.isArray(spec.regions) || !spec.regions.length) errors.push('regions must be nonempty');
  for (const [index, region] of (Array.isArray(spec.regions) ? spec.regions : []).entries()) {
    if (!object(region)) { errors.push(`regions[${index}] must be an object`); continue; }
    if (!text(region.id) || regionIds.has(region.id)) errors.push(`regions[${index}].id must be unique nonempty text`);
    else regionIds.add(region.id);
    if (!text(region.purpose)) errors.push(`regions[${index}].purpose required`);
    if (!Array.isArray(region.components) || !region.components.length || !region.components.every(text)) errors.push(`regions[${index}].components must be nonempty strings`);
  }
  const actionIds = new Set();
  if (!Array.isArray(spec.actions)) errors.push('actions must be an array');
  for (const [index, action] of (Array.isArray(spec.actions) ? spec.actions : []).entries()) {
    if (!object(action)) { errors.push(`actions[${index}] must be an object`); continue; }
    if (!text(action.id) || actionIds.has(action.id)) errors.push(`actions[${index}].id must be unique nonempty text`);
    else actionIds.add(action.id);
    if (!regionIds.has(action.regionId)) errors.push(`actions[${index}].regionId does not exist`);
    for (const key of ['trigger', 'behavior']) if (!text(action[key])) errors.push(`actions[${index}].${key} required`);
    for (const state of ['pending', 'success', 'error', 'recovery']) {
      if (!object(action.states) || !text(action.states[state])) errors.push(`actions[${index}].states.${state} required`);
    }
  }
  if (!Array.isArray(spec.assumptions) || !spec.assumptions.every(text)) errors.push('assumptions must be an array of nonempty strings');
  if (!Array.isArray(spec.decisions)) errors.push('decisions must be an array');
  for (const [index, decision] of (Array.isArray(spec.decisions) ? spec.decisions : []).entries()) {
    if (!object(decision) || !['subject', 'choice', 'reason'].every(key => text(decision[key]))) errors.push(`decisions[${index}] requires subject, choice and reason`);
  }
  if (spec.extensions !== undefined && !object(spec.extensions)) errors.push('extensions must be an object');
  return errors;
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  try {
    if (process.argv.length !== 3) throw new Error('Usage: node validate-page-spec.mjs <page-spec.json>');
    const errors = validateSpec(JSON.parse(await readFile(resolve(process.argv[2]), 'utf8')));
    if (errors.length) throw new Error(errors.join('\n'));
    console.log('Page contract structure passed. UI behavior, Ant usage and backend integration are not checked.');
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
