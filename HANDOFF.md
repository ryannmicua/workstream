# Handoff: Workstream Router

## Goal

Build a universal reference system that lets any AI agent session quickly locate and load context about any related work from any project folder.

See `VISION.md` for the approved acceptance policy.

## State

- **Done**: Brainstorming complete. Vision approved. Design decisions resolved.
- **In flight**: Implementation not started.
- **Untouched**: No registry file, no skill, no routing logic.

## Decisions (resolved by vision review)

- **Format**: Flat YAML file, local to the machine, not versioned.
- **Delivery**: Skill (loaded on demand).
- **Discovery**: The router may provide a way to discover workstreams, but the operator adds the entry.
- **Agent write-back**: Requires explicit instructions from the operator.
- **Scope**: Pointer to any location (folder, repo, URL, ticket, system, service). Not a project manager, not a search engine, not a CI pipeline.
- **Existing data sources**: The registry references, not duplicates:
  - Paseo's `~/.paseo/projects/projects.json`
  - ssd-it-ops `WORKBOARD.md`
  - Per-repo `AGENTS.md` files

## Paths

- `/home/rgm/repo/workstream-router/` — project root
- `/home/rgm/repo/` — all repos live here
- `/home/rgm/.paseo/projects/projects.json` — existing Paseo project registry
- `/home/rgm/.paseo/projects/workspaces.json` — existing Paseo workspace data
- `/home/rgm/repo/ssd-it-ops/WORKBOARD.md` — active work ticket index
- `/home/rgm/repo/ssd-it-ops/AGENTS.md` — rich agent instructions (IT ops conventions)
- `/home/rgm/repo/heypogi/AGENTS.md` — current project's agent instructions
- `/home/rgm/.config/opencode/opencode.jsonc` — global OpenCode config (minimal)
- `/home/rgm/.paseo/config.json` — Paseo config with provider definitions

## Next actions

1. Design the YAML entry schema (what fields, how references work).
2. Build a minimal v1 — a local YAML registry with entries for the 6 repos + a few active tickets.
3. Build the skill that loads the registry and routes to entry files.
4. Test routing from heypogi and ssd-it-ops.

## Traps

- Don't over-engineer the schema. A flat YAML list that agents can grep is the target.
- The registry must be writable by hand or by operator-instructed agents.
- Paseo's `projects.json` already exists — don't duplicate that data.
- Each repo has its own AGENTS.md conventions. Point to the entry file, don't summarize.
