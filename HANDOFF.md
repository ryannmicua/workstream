# Handoff: Workstream Router

## Goal

Build a universal reference system that lets any AI agent session, from any project folder, quickly locate and load context about any related work — projects, tickets, systems, services, docs, or scheduled work.

## State

- **Done**: Brainstorming complete. Concept validated. Data model sketched. Project folder created.
- **In flight**: Design decisions still open (format, location, delivery mechanism).
- **Untouched**: Implementation not started. No registry file, no skill, no routing logic.

## Decisions

- **Concept**: Call it a "workstream router" — not just project paths, but anything the user is actively working on or needs to reference.
- **Workstream types identified**: project, ticket, system, service, doc, scheduled, external.
- **Sibling project**: Sits at `~/repo/workstream-router/` alongside heypogi.
- **Existing data sources**:
  - Paseo already tracks projects in `~/.paseo/projects/projects.json` (6 repos: heypogi, atlas, guest-ops, itworkboard-cli, ssd-it-ops, arjim).
  - ssd-it-ops has an active WORKBOARD with open tickets (TKT-005 through TKT-033) and change plans.
  - Each repo has its own AGENTS.md with conventions and entry points.
  - User has a custom Paseo provider `ssdits` pointing to `http://wiz-bot.its.in.ssd.org:8642/v1`.
- **Options still open** (user said "I don't know" — leave for brainstorm):
  1. Single file (`~/WORKSTREAMS.md`) vs directory (`~/.workstreams/`) vs extend Paseo project data
  2. Skill (loaded on demand) vs global `~/CLAUDE.md` (always available)
  3. Registry format: YAML, Markdown, JSON, or hybrid

## Paths

- `/home/rgm/repo/workstream-router/` — new project root (empty, ready for design)
- `/home/rgm/repo/` — all repos live here
- `/home/rgm/.paseo/projects/projects.json` — existing Paseo project registry
- `/home/rgm/.paseo/projects/workspaces.json` — existing Paseo workspace data
- `/home/rgm/repo/ssd-it-ops/WORKBOARD.md` — active work ticket index
- `/home/rgm/repo/ssd-it-ops/AGENTS.md` — rich agent instructions (IT ops conventions)
- `/home/rgm/repo/heypogi/AGENTS.md` — current project's agent instructions
- `/home/rgm/.config/opencode/opencode.jsonc` — global OpenCode config (minimal)
- `/home/rgm/.paseo/config.json` — Paseo config with provider definitions

## Next actions

1. Run the brainstorm session: decide single-file vs directory vs Paseo extension, and skill vs global instructions.
2. Design the workstream entry schema (what fields, what types, how relationships work).
3. Build a minimal v1 — even if it's just a `~/WORKSTREAMS.md` with entries for the 6 repos + a few active tickets — and test routing from heypogi.

## Traps

- Don't over-engineer the schema on v1. A flat list that agents can grep is better than a complex YAML tree that nobody maintains.
- The registry must be writable by hand (the user will edit it), not just machine-generated.
- Paseo's `projects.json` already exists — don't duplicate that data. Reference or extend it, don't reinvent it.
- Each repo has its own AGENTS.md conventions. The router should point to the entry file, not try to summarize every repo's rules.
