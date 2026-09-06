---
lorespec: "0.1"
id: "2026090601"
date: "2026-09-06"
source: "opencode"
topic: "Resolve relative path in registry after add command stores literal dot"
tags: [bugfix, cli, path-resolution, registry]
classification:
  type: technical
  domains: [cli, nodejs]
  value: medium
trails: [workstream-development]
---

## Session Arc

### Started
User ran `workstream add workstream --path .` and `workstream list` showed `workstream .` instead of the absolute path. Expected `workstream /home/rgm/repo/workstream`.

### Pivots
- Discovered the fix from the previous session (2026090501) had already been shipped in PR #3, but the existing registry entry predates the fix and still contains `path: .`.

### Ended
Both the code and the existing registry entry were fixed. `workstream list` now shows the absolute path.

## SOLUTIONS

### S1: Add command resolves relative paths to absolute
- **What was broken:** `workstream add <name> --path .` stored the literal `.` in the registry, causing `workstream list` to display `.` and breaking `resolveContext`'s `isAbsolute()` checks.
- **What fixed it:** In `src/commands/add.mjs`, imported `resolve` from `node:path` and changed line 58 from `flags.path` to `resolve(flags.path)`. Also updated the existing registry entry in `~/.workstream/registry.yaml` from `path: .` to `path: /home/rgm/repo/workstream`.
- **Why it works:** `path.resolve()` converts relative paths (`.`, `..`, `./subdir`) to absolute paths based on `process.cwd()` at add-time.
- **Caveats:** Entries added before the fix may still have relative paths in the registry. No migration script exists.

## DECISIONS

### D1: Fix both code and existing registry entry
- **Issue:** Should we fix only the code, or also update the existing stale entry?
- **Positions:** Code-only fix vs. code + manual registry update
- **Warrant:** The existing entry would remain broken without manual intervention. Quick one-off fix is simpler than writing a migration command.
- **Status:** settled

## INSIGHTS

### I1: Stale registry entries from pre-fix versions
- Users who added workstreams before the path-resolution fix will have relative paths in their registry. A `workstream migrate` or `workstream fix-paths` command could address this, but is low priority.
- **Confidence:** high

## NEXT STEPS

### N1: Consider adding a registry migration command
- **What:** `workstream migrate` or `workstream doctor` to scan for and fix relative paths in existing entries
- **Urgency:** someday

## CONNECTIONS

- S1 —[supersedes]→ (the same fix from 2026090501, re-applied to the existing registry entry)
- I1 —[informed_by]→ S1 (discovering the stale entry led to the insight)

## Trail Updates

- **workstream-development:** Extended with registry entry fix pattern
