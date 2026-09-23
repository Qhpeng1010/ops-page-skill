#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { basename, dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const controls = new Set(['input', 'select', 'date', 'date-range', 'number', 'textarea']);
const formats = new Set(['text', 'amount', 'status', 'category', 'date']);
const text = value => typeof value === 'string' && value.trim().length > 0;
const unique = values => new Set(values).size === values.length;
function issue(errors, condition, message) { if (!condition) errors.push(message); }
function fields(errors, list, path) {
  issue(errors, Array.isArray(list) && list.length > 0, `${path} must be a non-empty array.`);
  if (!Array.isArray(list)) return;
  const keys = list.map(field => field?.key);
  issue(errors, keys.every(text) && unique(keys), `${path} keys must be unique non-empty strings.`);
  list.forEach((field, index) => {
    issue(errors, text(field?.label), `${path}[${index}].label is required.`);
    issue(errors, controls.has(field?.control), `${path}[${index}].control is unsupported.`);
    if (field?.control === 'select') issue(errors, Array.isArray(field.options) && field.options.length > 0, `${path}[${index}].options is required for select.`);
  });
}
function validate(spec) {
  const errors = [];
  issue(errors, spec && typeof spec === 'object' && !Array.isArray(spec), 'Page Spec must be an object.');
  if (!spec || typeof spec !== 'object') return errors;
  issue(errors, spec.schemaVersion === 1, 'schemaVersion must be 1.');
  issue(errors, spec.runtime === 'ops-page-spec', 'runtime must be ops-page-spec.');
  issue(errors, spec.metadata && text(spec.metadata.changeId) && text(spec.metadata.title) && text(spec.metadata.family) && text(spec.metadata.request), 'metadata requires changeId, title, family and request.');
  issue(errors, spec.metadata?.family === 'list', 'ops-page-spec currently supports family=list.');
  issue(errors, spec.shell && text(spec.shell.projectKey) && text(spec.shell.group) && text(spec.shell.pageKey), 'shell requires projectKey, group and pageKey.');
  const query = spec.list?.query;
  fields(errors, query?.fields, 'list.query.fields');
  issue(errors, query?.collapseThreshold === undefined || Number.isInteger(query.collapseThreshold) && query.collapseThreshold > 0, 'list.query.collapseThreshold must be a positive integer.');
  const table = spec.list?.table;
  issue(errors, table && text(table.rowKey) && text(table.title), 'list.table requires rowKey and title.');
  issue(errors, table?.actionDisplay === undefined || table.actionDisplay === 'expanded', 'list.table.actionDisplay must be expanded when provided.');
  if (table?.create) {
    fields(errors, table.create.form?.fields, 'list.table.create.form.fields');
    issue(errors, text(table.create.label) && text(table.create.form?.title), 'list.table.create requires label and form.title.');
    issue(errors, table.create.presentation === 'modal', 'list.table.create.presentation must be modal.');
  }
  const columns = table?.columns;
  issue(errors, Array.isArray(columns) && columns.length > 0, 'list.table.columns must be a non-empty array.');
  if (Array.isArray(columns)) {
    const keys = columns.map(column => column?.key);
    issue(errors, keys.every(text) && unique(keys), 'list.table column keys must be unique non-empty strings.');
    columns.forEach((column, index) => {
      issue(errors, text(column?.title), `list.table.columns[${index}].title is required.`);
      issue(errors, formats.has(column?.format ?? 'text'), `list.table.columns[${index}].format is unsupported.`);
      if (column?.format === 'amount') issue(errors, text(column.unit), `list.table.columns[${index}].unit is required for amount.`);
    });
  }
  const rows = table?.rows;
  issue(errors, Array.isArray(rows), 'list.table.rows must be an array.');
  if (Array.isArray(rows)) {
    const ids = rows.map(row => row?.[table.rowKey]);
    issue(errors, ids.every(value => value !== undefined && value !== null && value !== '') && unique(ids), 'list.table row keys must be unique.');
  }
  const detail = table?.detail;
  if (detail) {
    issue(errors, text(detail.title), 'list.table.detail.title is required.');
    issue(errors, Array.isArray(detail.groups) && detail.groups.length > 0, 'list.table.detail.groups must be non-empty.');
    (detail.groups || []).forEach((group, index) => {
      issue(errors, text(group?.key) && text(group?.title), `list.table.detail.groups[${index}] requires key and title.`);
      issue(errors, Array.isArray(group?.fields) || Array.isArray(group?.columns), `list.table.detail.groups[${index}] requires fields or columns.`);
    });
  }
  return errors;
}
export function validateOpsPageSpec(spec) { const errors = validate(spec); return { valid: errors.length === 0, errors }; }
const arg = process.argv[2];
if (arg && process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  try {
    const spec = JSON.parse(await readFile(resolve(arg), 'utf8'));
    const result = validateOpsPageSpec(spec);
    if (!result.valid) throw new Error(result.errors.join('\n'));
    if (spec.metadata?.changeId !== basename(dirname(resolve(arg)))) throw new Error('metadata.changeId must match the Change directory.');
    console.log('Ops Page Spec validation passed.');
  } catch (error) { console.error(`Ops Page Spec validation failed:\n${error.message}`); process.exitCode = 1; }
}
