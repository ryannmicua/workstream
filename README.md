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

## Schema

The registry is a flat YAML list. No validation — if it parses as YAML, it works.

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

- **Setup** — install skill, create registry
- **Load** — parse the YAML registry
- **List** — show available workstreams
- **Route** — load a workstream's context file by name
- **Add** — append a new entry
- **Remove** — delete an entry

## Status

**Done:** Vision approved. Schema designed. v1 capabilities defined. Strategy written.
**Next:** Build the skill, build a minimal v1 registry, test routing.

See `VISION.md` for principles and scope. See `STRATEGY.md` for direction.

## Traps

- Don't over-engineer the schema. A flat YAML list that agents can grep is the target.
- The registry must be writable by hand or by operator-instructed agents.
- Paseo's `projects.json` already exists — don't duplicate that data.
- Each repo has its own AGENTS.md conventions. Point to the entry file, don't summarize.
