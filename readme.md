# Sebotics-AX App

A production-ready platform to dispatch, monitor, and administer Autoxing-based Junobot service robots in restaurant and hospitality environments. It replaces hardware call buttons with a modern app experience built for real operational constraints (robots already running jobs, multiple devices, queueing, priorities, and destination reachability).

This repo contains two **separate projects**:
- `app/` for the client application
- `server/` for the NestJS + Postgres backend

Each project has its own README and setup steps.

Auth chain: **End user ↔ Sebotics ↔ Autoxing** (auth is separated: end users authenticate with Sebotics; Sebotics authenticates with Autoxing).

## Project Readmes
- Client app: `app/README.md`
- Server: `server/README.md`
- CI/CD guide: `docs/ci-cd-gcp.md`

## Google Cloud deployment
- `server/`: deploy as a container to Cloud Run (NestJS API).
- `app/`: deploy as a container to Cloud Run using `app/Dockerfile` (static Vite build served by Nginx).

### Standard deployment workflow (Cloud Build + Cloud Run)
1. Enable required APIs:
   - Cloud Build
   - Cloud Run
   - Artifact Registry
   - Secret Manager
2. Create Artifact Registry repository (once):
   ```bash
   gcloud artifacts repositories create sebotics \
     --repository-format=docker \
     --location=us-central1
   ```
3. Deploy server first:
   ```bash
   gcloud builds submit . \
     --config cloudbuild.server.yaml \
     --substitutions=_REGION=us-central1,_AR_REPO=sebotics,_SERVER_SERVICE=sebotics-ax-server
   ```
4. Deploy app second (set backend URL):
   ```bash
   gcloud builds submit . \
     --config cloudbuild.app.yaml \
     --substitutions=_REGION=us-central1,_AR_REPO=sebotics,_APP_SERVICE=sebotics-ax-app,_ENV_VARS=VITE_PUBLIC_API_URL=https://YOUR_SERVER_URL/api
   ```

## Repository Structure
```repo-root/
app/                     # Client app
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
