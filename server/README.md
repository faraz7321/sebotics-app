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
- **Robot**: `serialNumber`, `assignedUserId`, `assignedAt`
- **Rule**: **One robot can only be assigned to one account** (robot serial is unique)

## API (initial)
- `POST /api/auth/register` → create client account
- `POST /api/auth/login` → obtain JWT
- `GET /api/users/me` → current user profile
- `GET /api/robots/my` → list robots assigned to the signed-in client
- `POST /api/robots/register` → admin registers a robot by serial
- `POST /api/robots/assign` → admin assigns a robot to a user
- `POST /api/robots/unassign` → admin removes an assignment
- `GET /api/robots` → admin list of all robots + assignments

## Local setup
```bash
cd server
cp .env.example .env
npm install
npm run prisma:generate
npm run prisma:migrate -- --name init
npm run dev
```

To create an **admin** user in the initial version:
1. Register normally (client)
2. Update the user role in Postgres to `ADMIN`

## Autoxing Authentication (CSP API)
Sebotics authenticates with Autoxing using the CSP API authentication flow (end users never do). This is **service-to-service auth** that is separate from end-user auth. The server creates an MD5 signature from `appId + timestamp + appSecret`, sends it to `/auth/v1.1/token`, and caches the returned access token until it expires.

Required env vars (see `.env.example`):
- `AUTOXING_APP_ID`
- `AUTOXING_APP_SECRET`
- `AUTOXING_APP_CODE` (sent as the `Authorization` header)
- `AUTOXING_BASE_URL` (defaults to `https://api.autoxing.com`)
- `AUTOXING_TIMESTAMP_UNIT` (`ms` default, set to `s` if your tenant expects seconds)

## Auth separation (summary)
- **End user → Sebotics:** normal user auth (`/api/auth/register`, `/api/auth/login`) with JWTs issued by Sebotics.
- **Sebotics → Autoxing:** server-to-server CSP API auth using `AUTOXING_*` credentials, never exposed to end users.

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
