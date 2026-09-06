---
title: Subcommand Reference
---

# Subcommand Reference

This document covers every `workstream` subcommand: synopsis, accepted flags, step-by-step behavior, output format, error codes, and examples.

## Table of Contents

- [Global Flags](#global-flags)
- [list](#list)
- [find](#find)
- [add](#add)
- [remove](#remove)
- [setup](#setup)

## Global Flags

These flags work with any subcommand:

| Flag | Description |
|------|-------------|
| `--json` | Output results as JSON instead of plain text |
| `--help`, `-h` | Show usage information and exit |
| `--version`, `-v` | Show version number and exit |

When `--json` is used, all commands return a JSON object matching the command's result structure.

---

## list

### Synopsis

```
workstream list [--names] [--full] [--match <pattern>]
```

### Flags

| Flag | Required | Description |
|------|----------|-------------|
| `--names` | no | Print only workstream names (one per line) |
| `--full` | no | Print name, path, context, and description for each entry |
| `--match <pattern>`, `-m <pattern>` | no | Filter entries by case-insensitive substring match on name |

When neither `--names` nor `--full` is specified, output is tab-separated `name\tpath`.

### Behavior

1. Loads the registry from `~/.workstream/registry.yaml` (or `$WORKSTREAM_HOME/.workstream/registry.yaml` if set).
2. If the registry is empty, returns a message suggesting `workstream add`.
3. If `--match` is provided, filters entries whose name contains the pattern (case-insensitive).
4. Returns the filtered list for output formatting.

### Output

- **Default:** Tab-separated `name` and `path`, one entry per line.
- **`--names`:** One name per line.
- **`--full`:** Multi-line block per entry with `name:`, `path:`, `context:`, and `description:` fields.
- **`--json`:** JSON object with `entries` array.

### Errors

| Code | Message | Action |
|------|---------|--------|
| `REGISTRY_NOT_FOUND` | Registry not found. Run `workstream setup` to create it. | Run `workstream setup` |

### Examples

```bash
# List all workstreams
workstream list

# List names only
workstream list --names

# Full details
workstream list --full

# Filter by substring
workstream list --match proxy

# JSON output
workstream list --json
```

---

## find

### Synopsis

```
workstream find <name>
```

### Flags

None.

### Arguments

| Arg | Required | Description |
|-----|----------|-------------|
| `name` | yes | The workstream name to look up |

### Behavior

1. Loads the registry and searches for an entry with a matching `name`.
2. If not found, suggests similar names using fuzzy substring matching (both directions).
3. Resolves the context file path:
   - If `context` is an absolute path, uses it directly.
   - If `context` is relative and `path` is absolute, resolves relative to `path`.
   - Otherwise returns the reference as-is (non-local).
4. Performs path traversal detection: if the resolved context path falls outside the workstream's `path`, returns a warning instead of contents.
5. For local paths, reads the file contents. For non-local paths (URLs, SSH-style), returns the reference without contents.
6. For missing or unreadable files, returns the reference with a warning.

### Output

- **`name`:** The workstream name.
- **`path`:** The workstream path.
- **`context`:** The resolved context reference path.
- **`content`:** File contents (if local and readable), otherwise `null`.
- **`description`:** The description string, or `null`.
- **`warnings`:** Array of warning strings (may be empty).
- **`--json`:** JSON object with all fields above.

When not using `--json`, the content is printed directly to stdout. Warnings go to stderr.

### Errors

| Code | Message | Action |
|------|---------|--------|
| `MISSING_ARGUMENT` | Missing workstream name. | Usage: `workstream find <name>` |
| `NOT_FOUND` | Workstream "X" not found. | Use `workstream list` to see available workstreams. |

### Context Resolution Notes

- **Absolute context path:** Used as-is.
- **Relative context + absolute path:** Resolved via `path.resolve(entry.path, entry.context)`.
- **Non-local path:** Returned as reference; fetch by other means.
- **Path traversal:** If resolved context falls outside `path`, returns `path-traversal` warning.
- **Missing file:** Returns `missing-context` warning.
- **Unreadable file:** Returns `unreadable` warning.

### Examples

```bash
# Find a workstream and print its context
workstream find heypogi

# JSON output
workstream find atlas --json
```

---

## add

### Synopsis

```
workstream add <name> --path <path> [--context <file>] [--desc <text>]
```

### Flags

| Flag | Required | Description |
|------|----------|-------------|
| `--path <path>` | yes | Path where the workstream lives |
| `--context <file>` | no | Entry file to load (relative to path, or absolute) |
| `--desc <text>` | no | One-line description |

### Arguments

| Arg | Required | Description |
|-----|----------|-------------|
| `name` | yes | Human-readable identifier for the workstream |

### Behavior

1. Validates name is not empty and contains no newlines.
2. Validates `--path` is provided.
3. Loads the existing registry (creates directory if missing).
4. Checks for duplicate names. If the name already exists, throws `DUPLICATE_NAME`.
5. Resolves the path to an absolute path via `path.resolve()`.
6. Formats the new entry as YAML with proper quoting for special characters.
7. Appends the entry to the registry file.
8. Creates the registry directory if it doesn't exist.

### Output

- **Plain text:** `Added <name>`
- **`--json`:** JSON object with `message` field.

### Errors

| Code | Message | Action |
|------|---------|--------|
| `MISSING_ARGUMENT` | Missing workstream name. | Usage: `workstream add <name> --path <path>` |
| `MISSING_ARGUMENT` | Missing --path for "X". | Usage: `workstream add <name> --path <path>` |
| `INVALID_INPUT` | Name must not contain newlines. | — |
| `DUPLICATE_NAME` | Workstream "X" already exists. | Remove it first: `workstream remove X` |

### YAML Quoting

Values containing any of `: { } [ ] , & * ? | > ! % @ \` or starting/ending with spaces, empty strings, or leading digits are automatically double-quoted with backslash escaping.

### Examples

```bash
# Add a basic workstream
workstream add myproject --path /home/user/projects/myproject

# With context and description
workstream add myproject --path /home/user/projects/myproject --context AGENTS.md --desc "My project agent instructions"

# Remote path
workstream add atlas --path https://github.com/rgm/atlas --context README.md

# JSON output
workstream add test --path /tmp/test --json
```

---

## remove

### Synopsis

```
workstream remove <name> [-q]
```

### Flags

| Flag | Required | Description |
|------|----------|-------------|
| `-q`, `--quiet` | no | Skip interactive confirmation prompt |

### Arguments

| Arg | Required | Description |
|-----|----------|-------------|
| `name` | yes | The workstream name to remove |

### Behavior

1. Loads the registry and finds the entry with matching name.
2. If not found, throws `NOT_FOUND`.
3. Unless `-q` is specified:
   - Checks if stdin is a TTY. If not, throws `NON_TTY_PROMPT`.
   - Prompts `Remove "X"? [y/N]` and waits for input.
   - If answer is not `y` or `yes`, returns `Cancelled.`
4. Removes the entry from the YAML document, preserving any `commentBefore` on the preceding entry.
5. If the registry becomes empty, writes an empty file.
6. Otherwise writes the modified YAML back.

### Output

- **Plain text:** `Removed <name>` (or `Cancelled.` if user declines)
- **`--json`:** JSON object with `message` field.

### Errors

| Code | Message | Action |
|------|---------|--------|
| `MISSING_ARGUMENT` | Missing workstream name. | Usage: `workstream remove <name> [-q]` |
| `NOT_FOUND` | Workstream "X" not found. | Use `workstream list` to see available workstreams. |
| `NON_TTY_PROMPT` | Cannot prompt for confirmation on non-TTY input. | Use `-q` to skip confirmation |

### Comment Preservation

When removing an entry that has a `commentBefore` (YAML comment above it), the comment is moved to the preceding entry's `commentBefore` to avoid losing documentation.

### Examples

```bash
# Interactive remove
workstream remove myproject

# Skip confirmation (useful in scripts)
workstream remove myproject -q

# JSON output
workstream remove test --json
```

---

## setup

### Synopsis

```
workstream setup
```

### Flags

None.

### Behavior

1. **Preflight checks:**
   - Verifies Node.js version is 22 or later.
   - Verifies the `yaml` package is importable.

2. **Link CLI binary:**
   - Runs `npm link` in the repo directory to create a global `workstream` command.
   - If linking fails, reports `manual` status with instructions.

3. **Create registry:**
   - Creates `~/.workstream/` directory if missing.
   - Creates `~/.workstream/registry.yaml` with template comments if it doesn't exist.
   - Reports `already present` if the file exists.

4. **Install agent skill:**
   - Copies `skill/SKILL.md` to `~/.agents/skills/workstream/SKILL.md` with a version stamp.
   - If `claude` is on PATH, also copies to `~/.claude/skills/workstream/SKILL.md`.

5. **Install bash completion:**
   - Copies `completions/workstream.bash` to `~/.local/share/bash-completion/completions/workstream`.
   - Creates the completions directory if missing.

6. **PowerShell completion:**
   - Notes the availability of `completions/workstream.ps1` for manual installation.

### Output

A summary table showing each artifact's status:

```
cli                     /usr/bin/workstream
registry                /home/user/.workstream/registry.yaml
skill                   /home/user/.agents/skills/workstream/SKILL.md
skill                   /home/user/.claude/skills/workstream/SKILL.md
bash-completion         /home/user/.local/share/bash-completion/completions/workstream
powershell-completion   /path/to/completions/workstream.ps1
                        copy manually or run setup in PowerShell
```

Status values: `linked`, `manual`, `created`, `already present`, `available`, `skipped`.

### Errors

| Code | Message | Action |
|------|---------|--------|
| `PREFLIGHT_FAILED` | Node.js 22+ required. Current: vX.Y.Z | Upgrade Node.js to version 22 or later. |
| `PREFLIGHT_FAILED` | yaml package not found. | Run: `npm install` |

### Examples

```bash
# Full setup
workstream setup
```

---

## Hidden Command: --completion-names

```
workstream --completion-names
```

This command is used internally by the bash completion script. It outputs one workstream name per line, suitable for tab-completion.

```bash
# Used by bash completion (not intended for direct use)
workstream --completion-names
```
