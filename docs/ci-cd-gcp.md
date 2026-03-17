# CI/CD on Google Cloud Run

This repository uses:
- **CI**: GitHub Actions (`.github/workflows/ci.yml`)
- **CD**: GitHub Actions + Cloud Build (`.github/workflows/cd.yml`, `cloudbuild.*.yaml`)

## Pipeline behavior

- Pull requests and pushes to `main`/`master` run CI:
  - app lint + build
  - server Prisma generate + build
  - docker image build checks for app and server
- Push to `main`/`master` (or manual dispatch) runs CD:
  1. Deploy server via `cloudbuild.server.yaml`
  2. Read server URL
  3. Deploy app via `cloudbuild.app.yaml` with runtime `VITE_PUBLIC_API_URL`
  4. Read app URL
  5. Update server `CORS_ORIGIN` to app URL (or override)

## Required Google Secret Manager secrets

The server Cloud Run service expects:
- `SEBOTICS_AX_DATABASE_URL`
- `SEBOTICS_AX_JWT_SECRET`
- `SEBOTICS_AX_REFRESH_TOKEN_SECRET`
- `SEBOTICS_AX_AUTOXING_APP_ID`
- `SEBOTICS_AX_AUTOXING_APP_SECRET`
- `SEBOTICS_AX_AUTOXING_APP_CODE`
- `SEBOTICS_AX_MAPBOX_TOKEN`

These are mapped to runtime env vars (`DATABASE_URL`, `JWT_SECRET`, `MAPBOX_TOKEN`, etc.) in
`cloudbuild.server.yaml` substitution `_SECRETS` and `_MAPBOX_TOKEN_SECRET`.

## GitHub repository secrets

Set these in GitHub: `Settings > Secrets and variables > Actions > Secrets`.

- `GCP_WORKLOAD_IDENTITY_PROVIDER`
  - Example: `projects/123456789/locations/global/workloadIdentityPools/github/providers/github-oidc`
- `GCP_DEPLOYER_SERVICE_ACCOUNT`
  - Service account email used by GitHub Actions to call GCP APIs

## GitHub repository variables (optional overrides)

Set these in `Settings > Secrets and variables > Actions > Variables`.

- `GCP_PROJECT_ID` (default: `sebotics`)
- `GCP_REGION` (default: `europe-west1`)
- `GCP_ARTIFACT_REPO` (default: `sebotics`)
- `GCP_SERVER_SERVICE` (default: `sebotics-ax-server`)
- `GCP_APP_SERVICE` (default: `sebotics-ax-app`)
- `GCP_SERVER_RUNTIME_SA` (default: `sebotics-ax-server-sa@sebotics.iam.gserviceaccount.com`)
- `GCP_APP_RUNTIME_SA` (default: `sebotics-ax-app-sa@sebotics.iam.gserviceaccount.com`)
- `GCP_CLOUDSQL_CONNECTION` (optional, `PROJECT:REGION:INSTANCE`)
- `GCP_DATABASE_URL_SECRET` (GCP Secret Manager secret name for `DATABASE_URL`)
- `GCP_MAPBOX_TOKEN` (GCP Secret Manager secret name for `MAPBOX_TOKEN`, e.g. `SEBOTICS_AX_MAPBOX_TOKEN`)
- `GCP_API_BASE_URL` (default: `https://ax-server.sebotics.com/api`)
- `GCP_APP_PUBLIC_URL` (default: `https://ax-app.sebotics.com`)
- `GCP_SERVER_CORS_ORIGIN` (default: `https://ax-app.sebotics.com`)

## One-time IAM setup checklist

- Cloud Build SA has:
  - `roles/run.admin`
  - `roles/artifactregistry.writer`
  - `roles/iam.serviceAccountUser` on both runtime SAs
- Server runtime SA has:
  - `roles/secretmanager.secretAccessor`
  - `roles/cloudsql.client` (if Cloud SQL is used)
