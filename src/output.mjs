export function formatOutput(result, flags) {
  if (flags.json) {
    return JSON.stringify(result, null, 2);
  }

  if (result.entries) {
    return result.entries
      .map(entry => formatEntry(entry, flags))
      .join('\n');
  }

  if (result.content) {
    return result.content;
  }

  if (result.message) {
    return result.message;
  }

  return '';
}

function formatEntry(entry, flags) {
  if (flags.names) {
    return entry.name;
  }

  if (flags.full) {
    const parts = [`name: ${entry.name}`, `path: ${entry.path}`];
    if (entry.context) parts.push(`context: ${entry.context}`);
    if (entry.description) parts.push(`description: ${entry.description}`);
    return parts.join('\n');
  }

  // Default: name and path
  const parts = [entry.name, entry.path];
  return parts.join('\t');
}
