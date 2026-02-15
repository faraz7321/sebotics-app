# Sebotics App (Client)

A single codebase client application for iOS, Android, and Windows that lets end users operate robots assigned to their account by Sebotics.

Auth separation: end users authenticate only with Sebotics. The app never authenticates directly with Autoxing.

## Scope

### Operator experience
- Call a robot to a destination (table/zone/station)
- Send a robot to another destination (kitchen, bar, base)
- Auto-assign the next available robot or select a specific robot
- Queue tasks when robots are busy (with optional priority)
- See robot status (online/offline, idle/busy/charging/error)
- Optional: live location and path visualization if available from APIs

## Platform strategy
- Current implementation: **React + Vite** web client
- Deployed as a static SPA container (Nginx) on Cloud Run
- Mobile/desktop packaging can be layered later if needed

## Local development

```bash
cd app
cp .env.example .env
npm install
npm run dev
```

Default UI URL: `http://localhost:5173`

## Local development with Docker

```bash
cd app
cp .env.example .env
docker compose up --build
```

`APP_PORT` in `app/.env` controls host/container port mapping.

## Production container (Google Cloud Run)

This app includes `app/Dockerfile` for a static production build served by Nginx.
`VITE_PUBLIC_API_URL` is read at **runtime** (no rebuild needed per environment).

Build + deploy with Cloud Build (from repo root):

```bash
gcloud builds submit . --config cloudbuild.app.yaml \
  --substitutions=_REGION=us-central1,_AR_REPO=sebotics,_APP_SERVICE=sebotics-ax-app,_ENV_VARS=VITE_PUBLIC_API_URL=https://YOUR_SERVER_URL/api
```

Recommended production settings:
- Keep `--allow-unauthenticated` only if this frontend must be public.
- Use a dedicated runtime service account via `_SERVICE_ACCOUNT`.
- Pin scaling/resource substitutions (`_MIN_INSTANCES`, `_MAX_INSTANCES`, `_CPU`, `_MEMORY`) per environment.

Manual deploy option:

```bash
docker build -f app/Dockerfile \
  -t REGION-docker.pkg.dev/PROJECT_ID/REPO/sebotics-ax-app:latest app
docker push REGION-docker.pkg.dev/PROJECT_ID/REPO/sebotics-ax-app:latest

gcloud run deploy sebotics-ax-app \
  --image REGION-docker.pkg.dev/PROJECT_ID/REPO/sebotics-ax-app:latest \
  --region REGION \
  --platform managed \
  --allow-unauthenticated \
  --set-env-vars VITE_PUBLIC_API_URL=https://YOUR_SERVER_URL/api
```
