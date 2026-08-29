---
name: workstream
description: >
  Resolve and load workstream context by name. Use when the user asks to
  "load a workstream", "find my workstream", "what workstreams do I have",
  "show me my projects", or references any workstream by name.
user-invocable: true
---

# Workstream Skill

Resolve and load workstream context using the `workstream` CLI.

## When to use

- User asks "what workstreams do I have" → `workstream list`
- User says "load the heypogi workstream" → `workstream find heypogi`
- User wants to add a workstream → `workstream add <name> --path <path>`
- User wants to remove a workstream → `workstream remove <name> -q`
- User asks about a workstream's context → `workstream find <name>`

## Commands

### List workstreams
```
workstream list              # name and path
workstream list --names      # names only
workstream list --full       # all fields
workstream list --match <p>  # filter by pattern
```

### Find a workstream
```
workstream find <name>
```

Returns:
- `content` — the context file contents (when the context file is local and readable)
- `context` — the reference path or URL
- `path` — the workstream root path
- `warnings` — non-fatal notes (missing context, non-local reference)

A non-local path (URL or ssh-style) returns a reference without contents.
This is expected behavior, not an error. The agent fetches it by other means.

### Add a workstream
```
workstream add <name> --path <path> [--context <file>] [--desc <text>]
```

### Remove a workstream
```
workstream remove <name> [-q]
```

Without `-q`, prompts for confirmation. With non-TTY stdin, use `-q` to skip prompting.

## Setup

```
workstream setup
```

Creates `~/.workstream/registry.yaml`, installs the agent skill, and configures shell completion.

## Error handling

The CLI returns typed errors with resolution actions. When a command fails:
- Read the error message for what failed
- Read the action line for what to do next
- Non-zero exit code means failure; zero means success

## JSON output

All commands support `--json` for machine-readable output.
