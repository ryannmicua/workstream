import { loadRegistry } from '../registry.mjs';

export function listCommand(args, flags) {
  const { entries } = loadRegistry();

  if (entries.length === 0) {
    return {
      entries: [],
      message: 'No workstreams registered. Use `workstream add` to create one.',
      warnings: []
    };
  }

  let filtered = entries;

  if (flags.match) {
    const pattern = flags.match.toLowerCase();
    filtered = entries.filter(e => e.name.toLowerCase().includes(pattern));
  }

  return {
    entries: filtered,
    warnings: []
  };
}
