import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { parseDocument } from 'yaml';
import { getRegistryPath } from '../registry.mjs';
import { WorkstreamError } from '../errors.mjs';

export function addCommand(args, flags) {
  const name = args[0];
  if (!name) {
    throw new WorkstreamError(
      'Missing workstream name.',
      'MISSING_ARGUMENT',
      'Usage: workstream add <name> --path <path>'
    );
  }

  if (/[\n\r]/.test(name)) {
    throw new WorkstreamError('Name must not contain newlines.', 'INVALID_INPUT');
  }

  if (!flags.path) {
    throw new WorkstreamError(
      `Missing --path for "${name}".`,
      'MISSING_ARGUMENT',
      'Usage: workstream add <name> --path <path>'
    );
  }

  const registryPath = getRegistryPath();
  let raw = '';
  let existingNames = [];

  if (existsSync(registryPath)) {
    raw = readFileSync(registryPath, 'utf8');
    if (raw.trim()) {
      try {
        const doc = parseDocument(raw);
        if (doc.contents?.items) {
          for (const item of doc.contents.items) {
            const nameProp = item.items?.find(p => p.key?.value === 'name');
            if (nameProp?.value?.value) existingNames.push(nameProp.value.value);
          }
        }
      } catch {
        // Malformed registry — proceed; duplicate check will be skipped
      }
    }
  }

  if (existingNames.includes(name)) {
    throw new WorkstreamError(
      `Workstream "${name}" already exists.`,
      'DUPLICATE_NAME',
      'Remove it first: workstream remove ' + name
    );
  }

  const newEntry = { name, path: resolve(process.cwd(), flags.path) };
  if (flags.context) newEntry.context = flags.context;
  if (flags.desc) newEntry.description = flags.desc;

  const entryYaml = formatEntry(newEntry);
  raw = raw.trimEnd() + '\n' + entryYaml;

  const dir = dirname(registryPath);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(registryPath, raw, 'utf8');

  return { message: `Added ${name}` };
}

function formatEntry(entry) {
  let yaml = `- name: ${quoteYaml(entry.name)}\n`;
  yaml += `  path: ${quoteYaml(entry.path)}\n`;
  if (entry.context) yaml += `  context: ${quoteYaml(entry.context)}\n`;
  if (entry.description) yaml += `  description: ${quoteYaml(entry.description)}\n`;
  return yaml;
}

function quoteYaml(val) {
  if (/[:{}\[\],&*?|>!%@`]/.test(val) || val.startsWith(' ') || val.endsWith(' ') || val === '' || /^[\d]/.test(val)) {
    return `"${val.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
  }
  return val;
}
