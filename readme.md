# Sebotics-AX App

A production-ready platform to dispatch, monitor, and administer Autoxing-based Junobot service robots in restaurant and hospitality environments. It replaces hardware call buttons with a modern app experience built for real operational constraints (robots already running jobs, multiple devices, queueing, priorities, and destination reachability).

This repo contains two **separate projects**:
- `app/` for the client application (iOS/Android/Windows)
- `server/` for the NestJS + Postgres backend

Each project has its own README and setup steps.

Auth chain: **End user ↔ Sebotics ↔ Autoxing** (auth is separated: end users authenticate with Sebotics; Sebotics authenticates with Autoxing).

## Project Readmes
- Client app: `app/README.md`
- Server: `server/README.md`

## Repository Structure
```repo-root/
app/                     # Client app (iOS/Android/Windows)
server/                  # NestJS backend
docs/                    # architecture, runbooks, integration notes
infra/                   # Terraform / deployment manifests (optional)
```

## Key Concepts

### Task lifecycle
`queued → assigned → running → done / failed / canceled`

### Dispatching rules (default)
- No interruption of running jobs (unless privileged role enables it)
- Auto-assign to an **idle and capable** robot
- If none available → **queue**
- Priority tasks can jump the queue, but do not preempt running tasks unless explicitly enabled

## Roadmap
- Multi-robot dispatching + queue + status
- RBAC + Admin configuration (sites/robots/POIs)
- Live map + path visualization (if supported)
- Multi-tenant rollout templates (repeatable onboarding for new sites)
- Advanced analytics and reporting

## License
TBD
