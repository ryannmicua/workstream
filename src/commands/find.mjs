import { loadRegistry, resolveContext } from '../registry.mjs';
import { WorkstreamError } from '../errors.mjs';

export function findCommand(args, flags) {
  const name = args[0];
  if (!name) {
    throw new WorkstreamError(
      'Missing workstream name.',
      'MISSING_ARGUMENT',
      'Usage: workstream find <name>'
    );
  }

  const { entries } = loadRegistry();
  const entry = entries.find(e => e.name === name);

  if (!entry) {
    const suggestions = entries
      .map(e => e.name)
      .filter(n => {
        const lower = n.toLowerCase();
        const target = name.toLowerCase();
        return lower.includes(target) || target.includes(lower);
      });

    const suggestionText = suggestions.length > 0
      ? `\nDid you mean: ${suggestions.join(', ')}?`
      : '';

    throw new WorkstreamError(
      `Workstream "${name}" not found.${suggestionText}`,
      'NOT_FOUND',
      'Use `workstream list` to see available workstreams.'
    );
  }

  const { reference, contents, note } = resolveContext(entry);

  const warnings = [];
  if (note === 'missing-context') {
    warnings.push(`Context file not found: ${reference}`);
  } else if (note === 'non-local-path') {
    warnings.push('Context is a non-local reference; fetch it by other means.');
  } else if (note === 'unreadable') {
    warnings.push(`Context file unreadable: ${reference}`);
  } else if (note === 'path-traversal') {
    warnings.push(`Context path attempts traversal outside the workstream: ${reference}`);
  }

  return {
    name: entry.name,
    path: entry.path,
    context: reference,
    content: contents,
    description: entry.description || null,
    warnings
  };
}
