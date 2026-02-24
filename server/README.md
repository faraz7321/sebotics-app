# Sebotics Server (NestJS + Postgres)

Sebotics acts as a **middleware layer** between end users and Autoxing:
- **Sebotics is the only party that authenticates with Autoxing** (via the CSP API Authentication flow)
- **End users authenticate only with Sebotics**, never with Autoxing
- **Autoxing provides robots to Sebotics**
- **Sebotics assigns specific robots to end users**
- **End users never access robots directly**; they only access robots **assigned by Sebotics**

Auth chain: **End user ↔ Sebotics ↔ Autoxing**

## Data model (initial)
- **User**: `username`, `passwordHash`, `role` (`ADMIN` or `CLIENT`)
- **Business**: external Autoxing business/building identifier
- **BusinessUserMapping**: many-to-many user/business authorization mapping
- **Rule**: robot access is resolved at runtime from live Autoxing payload + `BusinessUserMapping`

## API (initial)
- `POST /api/auth/register` → create client account
- `POST /api/auth/login` → obtain JWT
- `GET /api/users` → admin list of all users
- `GET /api/users/me` → current user profile
- `POST /api/autoxing/robots/list` → live robot list filtered by `BusinessUserMapping`
- `GET /api/autoxing/robots/:robotId/state` → live robot state (authorized businesses only)
- `GET /api/autoxing/robots/:robotId/state-v2` → live robot state v2 (authorized businesses only)

## Robot data separation
- `/api/autoxing/robots/*` always fetches LIVE robot data from Autoxing at request time.
- Access to LIVE robot/business data is filtered at runtime via `BusinessUserMapping`.

## Local setup
```bash
cd server
cp .env.example .env
npm install
npm run prisma:generate
npm run prisma:migrate -- --name init
npm run dev
```

## Local setup with Docker
```bash
cd server
cp .env.example .env
docker compose up --build
```

By default, `docker compose` uses the bundled `postgres` service and injects
`DATABASE_URL` automatically for the API container.

Use `DATABASE_URL_CONTAINER` in `server/.env` only when you explicitly want the
container to connect to an external database.

To create an **admin** user in the initial version:
1. Register normally (client)
2. Update the user role in Postgres to `ADMIN`

## Google Cloud Run deployment

Build and deploy with Cloud Build (from repo root):

```bash
gcloud builds submit . \
  --config cloudbuild.server.yaml \
  --substitutions=_REGION=us-central1,_AR_REPO=sebotics,_SERVER_SERVICE=sebotics-ax-server
```

Manual build/push option:

```bash
docker build -f server/Dockerfile \
  -t REGION-docker.pkg.dev/PROJECT_ID/REPO/sebotics-ax-server:latest \
  server

docker push REGION-docker.pkg.dev/PROJECT_ID/REPO/sebotics-ax-server:latest
```

Deploy to Cloud Run:

```bash
gcloud run deploy sebotics-ax-server \
  --image REGION-docker.pkg.dev/PROJECT_ID/REPO/sebotics-ax-server:latest \
  --region REGION \
  --platform managed \
  --set-env-vars NODE_ENV=production,ENABLE_SWAGGER=false,AUTOXING_BASE_URL=https://apiglobal.autoxing.com,AUTOXING_TIMESTAMP_UNIT=ms \
  --set-secrets JWT_SECRET=projects/PROJECT_NUMBER/secrets/SEBOTICS_AX_JWT_SECRET:latest,REFRESH_TOKEN_SECRET=projects/PROJECT_NUMBER/secrets/SEBOTICS_AX_REFRESH_TOKEN_SECRET:latest,AUTOXING_APP_ID=projects/PROJECT_NUMBER/secrets/SEBOTICS_AX_AUTOXING_APP_ID:latest,AUTOXING_APP_SECRET=projects/PROJECT_NUMBER/secrets/SEBOTICS_AX_AUTOXING_APP_SECRET:latest,AUTOXING_APP_CODE=projects/PROJECT_NUMBER/secrets/SEBOTICS_AX_AUTOXING_APP_CODE:latest,DATABASE_URL=projects/PROJECT_NUMBER/secrets/SEBOTICS_AX_DATABASE_URL:latest
```

Notes:
- Cloud Run injects `PORT`; do not hardcode it in production settings.
- Prefer Secret Manager for `JWT_SECRET`, `REFRESH_TOKEN_SECRET`, and Autoxing credentials.
- For Cloud SQL, use a Cloud SQL connection strategy instead of `host.docker.internal`.
- For automated CI/CD from GitHub Actions, see `docs/ci-cd-gcp.md`.

Health endpoints for Cloud Run probes:
- `GET /api/health/live`
- `GET /api/health/ready`

## Autoxing Authentication (CSP API)
Sebotics authenticates with Autoxing using the CSP API authentication flow (end users never do). This is **service-to-service auth** that is separate from end-user auth. The server creates an MD5 signature from `appId + timestamp + appSecret`, sends it to `/auth/v1.1/token`, and caches the returned access token until it expires.

Required env vars (see `.env.example`):
- `AUTOXING_APP_ID`
- `AUTOXING_APP_SECRET`
- `AUTOXING_APP_CODE` (sent as the `Authorization` header)
- `AUTOXING_BASE_URL` (defaults to `https://api.autoxing.com`)
- `AUTOXING_WS_BASE_URL` (defaults to `wss://serviceglobal.autoxing.com`)
- `AUTOXING_TIMESTAMP_UNIT` (`ms` default, set to `s` if your tenant expects seconds)

## Autoxing WebSocket bridge (server-side tunnel)
Frontend does not connect to Autoxing directly. It connects to Sebotics WebSocket and Sebotics opens/closes upstream Autoxing WebSocket connections on subscribe/unsubscribe.

- Client endpoint: `ws://<server>/ws/autoxing` (or `wss://` in production)
- Authentication: session cookie (`refreshToken`) is used by the server during WS upgrade; client never sends Autoxing token.
- Client command to subscribe:
  ```json
  {"action":"subscribe.robot.oversee","robotId":"<robotId>"}
  ```
- Client command to unsubscribe:
  ```json
  {"action":"unsubscribe.robot.oversee","robotId":"<robotId>"}
  ```
- Upstream source (opened by server):
  `wss://serviceglobal.autoxing.com/robot-control/oversee/{robotId}`
- Upstream handshake auth:
  `Sec-WebSocket-Protocol` is set to Autoxing token `key`.
- Upstream keepalive:
  server sends `{"reqType":"onHeartBeat"}` every 5 seconds.

Forwarded event to client:
```json
{
  "event": "robot.oversee",
  "robotId": "<robotId>",
  "payload": { "...autoxing message..." },
  "receivedAt": 0
}
```

## Auth separation (summary)
- **End user → Sebotics:** normal user auth (`/api/auth/register`, `/api/auth/login`) with JWTs issued by Sebotics.
- **Sebotics → Autoxing:** server-to-server CSP API auth using `AUTOXING_*` credentials, never exposed to end users.

## Autoxing module structure
All Autoxing-specific code is under `src/autoxing`:
- `src/autoxing/auth` → Autoxing token acquisition and caching
- `src/autoxing/dto` → Request/response DTOs for proxied Autoxing endpoints
- `src/autoxing/services` → API client and domain services (robot/map/task/business)
- `src/autoxing/controllers` → Sebotics API controllers that proxy to Autoxing

Current Autoxing proxy routes:
- `POST /api/autoxing/robots/list` (filtered for CLIENT, full list for ADMIN)
- `GET /api/autoxing/robots/:robotId/state` (enforces business access for CLIENT)
- `GET /api/autoxing/robots/:robotId/state-v2` (enforces business access for CLIENT)
- `POST /api/autoxing/maps/pois/list`
- `PUT /api/autoxing/maps/pois/:areaId`
- `DELETE /api/autoxing/maps/pois/:poiId`
- `GET /api/autoxing/maps/pois/:poiId`
- `POST /api/autoxing/maps/areas/list`
- `GET /api/autoxing/maps/areas/:areaId/base-map`
- `GET /api/autoxing/maps/robots/:robotId/deploy`
- `POST /api/autoxing/tasks/v3`
- `POST /api/autoxing/tasks`
- `POST /api/autoxing/tasks/list`
- `GET /api/autoxing/tasks/v3/:taskId`
- `GET /api/autoxing/tasks/:taskId`
- `POST /api/autoxing/tasks/:taskId`
- `DELETE /api/autoxing/tasks/:taskId`
- `POST /api/autoxing/tasks/:taskId/execute`
- `POST /api/autoxing/tasks/v3/:taskId/cancel`
- `POST /api/autoxing/tasks/:taskId/cancel`
- `GET /api/autoxing/tasks/v2/:taskId/state`
- `POST /api/autoxing/buildings/list` (filtered for CLIENT, full list for ADMIN)
- `POST /api/autoxing/businesses/list` (filtered for CLIENT, full list for ADMIN)
- `POST /api/autoxing/businesses/assign` (ADMIN only)
- `POST /api/autoxing/businesses/unassign` (ADMIN only)

## Autoxing documentation

References:
- Autoxing JS SDK docs: https://autoxingtech.github.io/axdoc/zh/0x001.introduction/
- Cloud API docs: https://serviceglobal.autoxing.com/docs/api/zh-cn/
- Low-level chassis REST docs (advanced): https://autoxingtech.github.io/axbot_rest_book/

### SDK Access (Recommended for Business Functions)
The SDK is recommended for secondary development of business-level robot functions and workflows.

### Supported Development Scenarios
1. **On-robot development**
   - The robot has a host computer and an operation screen.
   - Business functions and apps are developed on the robot’s operating system and host computer.

2. **Off-robot / external terminal development**
   - Business apps developed on tablets, mobile phones, PCs, handheld devices, or business cloud management systems.

### SDK Documentation & Examples
- JS-SDK Documentation:
  https://autoxingtech.github.io/axdoc/zh/0x001.introduction/
- JS-SDK Server Example (running demo):
  http://serviceglobal.autoxing.com/sdk/v1.0/example/
- JS-SDK Server Example Source (JavaScript):
  https://github.com/AutoxingTech/AX_SDK1.0_Example
- JS-SDK Android WebView Demo Source:
  https://github.com/AutoxingTech/android_webview_demo
- Java-SDK Example Source:
  https://github.com/AutoxingTech/AX_Java_SDK1.0_Example

### Cloud API Access
Use Cloud API when you want more freedom across multiple languages and platforms, especially for cloud platforms, WMS/MES systems, mobile devices, and cloud management integrations.

### Cloud API Documentation & Demo
- Cloud API Documentation:
  https://serviceglobal.autoxing.com/docs/api/zh-cn/
- Cloud API Demo Source Code:
  https://github.com/AutoxingTech/APIDemo

### Robot Chassis-Level REST API (Advanced / Low-Level)
This interface is low-level and does not include business-layer logic. It is intended for advanced developers and may require custom application logic.

### REST API Documentation
https://autoxingtech.github.io/axbot_rest_book/

### External Elevator Control Access Interface
Recommended: use Autoxing’s elevator control module hardware. For third-party elevator controllers, follow the interface specification and transmit required status data.

### Elevator Control Interface Documentation
http://serviceglobal.autoxing.com/docs/elevator-control/
