import { readFileSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, resolve, isAbsolute, sep } from 'node:path';
import { parseDocument } from 'yaml';
import { WorkstreamError } from './errors.mjs';

const REGISTRY_DIR = '.workstream';
const REGISTRY_FILE = 'registry.yaml';

export function getRegistryPath(homeOverride) {
  const home = homeOverride || process.env.WORKSTREAM_HOME || homedir();
  return join(home, REGISTRY_DIR, REGISTRY_FILE);
}

export function loadRegistry(homeOverride) {
  const path = getRegistryPath(homeOverride);

  if (!existsSync(path)) {
    throw new WorkstreamError(
      'Registry not found. Run `workstream setup` to create it.',
      'REGISTRY_NOT_FOUND',
      'Run: workstream setup'
    );
  }

  const raw = readFileSync(path, 'utf8');

  if (!raw.trim()) {
    return { entries: [], document: null };
  }

  try {
    const document = parseDocument(raw);

    if (document.errors && document.errors.length > 0) {
      const err = document.errors[0];
      throw new WorkstreamError(
        `Failed to parse registry: ${err.message}`,
        'PARSE_ERROR',
        'Check the registry YAML syntax.'
      );
    }

    if (!document.contents) {
      return { entries: [], document };
    }

    if (document.contents.constructor?.name !== 'YAMLSeq') {
      throw new WorkstreamError(
        'Registry must be a YAML list, not a mapping.',
        'INVALID_SCHEMA',
        'The registry file should start with "- name: ..." entries.'
      );
    }

    const entries = [];
    for (const item of document.contents.items) {
      if (!item.items) {
        continue;
      }
      const entry = {};
      for (const prop of item.items) {
        const key = prop.key?.value;
        const val = prop.value?.value;
        if (key) entry[key] = val;
      }

      if (!entry.name) {
        throw new WorkstreamError(
          `Entry at position ${entries.length + 1} is missing required field "name".`,
          'VALIDATION_ERROR',
          'Each entry must have a "name" field.'
        );
      }
      if (!entry.path) {
        throw new WorkstreamError(
          `Entry "${entry.name}" is missing required field "path".`,
          'VALIDATION_ERROR',
          'Each entry must have a "path" field.'
        );
      }

      entries.push(entry);
    }

    return { entries, document };
  } catch (err) {
    if (err instanceof WorkstreamError) throw err;
    throw new WorkstreamError(
      `Failed to parse registry: ${err.message}`,
      'PARSE_ERROR',
      'Check the registry YAML syntax.'
    );
  }
}

export function resolveContext(entry) {
  if (!entry.context) {
    return { reference: null, contents: null, note: null };
  }

  const ref = isAbsolute(entry.context)
    ? entry.context
    : entry.path && isAbsolute(entry.path)
      ? resolve(entry.path, entry.context)
      : entry.context;

  if (isAbsolute(ref) && entry.path && isAbsolute(entry.path)) {
    const resolvedPath = resolve(entry.path);
    const resolvedRef = resolve(ref);
    if (!resolvedRef.startsWith(resolvedPath + sep) && resolvedRef !== resolvedPath) {
      return { reference: ref, contents: null, note: 'path-traversal' };
    }
  }

  if (!isAbsolute(ref)) {
    return { reference: ref, contents: null, note: 'non-local-path' };
  }

  if (!existsSync(ref)) {
    return { reference: ref, contents: null, note: 'missing-context' };
  }

  try {
    const contents = readFileSync(ref, 'utf8');
    return { reference: ref, contents, note: null };
  } catch {
    return { reference: ref, contents: null, note: 'unreadable' };
  }
}
