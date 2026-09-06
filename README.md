# Workstream

A universal reference system for AI agents — locate and load context about any related work from any project folder.

## What is a workstream?

Anything you're actively working on or need to reference:

| Type | Example |
|------|---------|
| project | heypogi, ssd-it-ops, atlas |
| ticket | TKT-005 (Proxmox baseline) |
| system | Proxmox host, FortiGate, Wiz bot |
| service | Hermes gateway, Guacamole jumpbox |
| doc | Runbook, architecture decision |
| scheduled | Heartbeat, cron job |
| external | Entra ID, M365 Teams, Synology NFS |

## Install

```bash
# From a clone of this repo:
npm install -g .

# Then run setup:
workstream setup
```

**Prerequisites:** Node.js 22+, npm, and npm's global bin directory on PATH.
Check with `npm prefix -g` — that directory must be in your `$PATH`.

**Platform support:** Linux, macOS, and native Windows (PowerShell and cmd).

## Usage

```bash
# List registered workstreams
workstream list

# Find a workstream and load its context
workstream find heypogi

# Add a new workstream
workstream add myproject --path /path/to/project --context AGENTS.md --desc "My project"

# Remove a workstream
workstream remove myproject -q

# Run setup (creates registry, installs skill, configures completion)
workstream setup
```

For detailed flag reference, behavior, output formats, and error codes, see [docs/subcommands.md](docs/subcommands.md).

## Schema

The registry is a flat YAML list at `~/.workstream/registry.yaml`.

| Field | Required | Description |
|-------|----------|-------------|
| `name` | yes | Human-readable identifier |
| `path` | yes | Where the workstream lives |
| `context` | no | Entry file to load |
| `description` | no | One-liner |

**Examples:**

```yaml
- name: heypogi
  path: /home/rgm/repo/heypogi
  context: AGENTS.md
  description: Current project's agent instructions

- name: ssd-it-ops
  path: /home/rgm/repo/ssd-it-ops
  context: WORKBOARD.md
  description: Active work ticket index

- name: atlas
  path: https://github.com/rgm/atlas
  context: README.md

- name: proxmox-host
  path: root@proxmox.local
  context: /etc/pve/qemu-server/100.conf
  description: Proxmox VM configuration

- name: hermes-gateway
  path: /home/rgm/repo/hermes
  context: docs/architecture.md
  description: API gateway service

- name: entraid
  path: /home/rgm/repo/ssd-it-ops
  context: docs/entraid-runbook.md
  description: Microsoft Entra ID integration

- name: synology-nfs
  path: admin@synology.local:/volume1
  context: README.md
  description: NAS file share
```

## Capabilities

- **Setup** — install skill, create registry, configure completion
- **List** — show available workstreams (--names, --full, --match)
- **Find** — load a workstream's context by name
- **Add** — append a new entry
- **Remove** — delete an entry

## How `find` works

- **Local context files** — returns the file contents directly
- **Non-local paths** (URLs, ssh-style) — returns the reference; fetch by other means
- **Missing context** — returns the reference with a warning, never errors

## Agent skill

The installed skill at `~/.claude/skills/workstream/SKILL.md` lets agents resolve workstreams by name without knowing file paths.

## Status

**Done:** Vision approved. Schema designed. v1 implemented. CLI, skill, setup, and completions shipped.

See `VISION.md` for principles and scope. See `STRATEGY.md` for direction.

## Traps

- Don't over-engineer the schema. A flat YAML list that agents can grep is the target.
- The registry must be writable by hand or by operator-instructed agents.
- Paseo's `projects.json` already exists — don't duplicate that data.
- Each repo has its own AGENTS.md conventions. Point to the entry file, don't summarize.
