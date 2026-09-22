# Insuredmine policy import service

Node.js/Express service for importing insurance-policy CSV/XLSX files into MongoDB, searching/aggregating policies, monitoring Node.js CPU, and scheduling messages with BullMQ and Redis.

## Features

- CSV/XLSX import in Node.js worker threads
- MongoDB collections for agents, users, accounts, categories, carriers, policies, import jobs, messages, and change audits
- File and row duplicate detection using SHA-256 hashes
- Policy-change audit trail
- First-name prefix and partial-email search
- Paginated policy aggregation
- Scheduled messages via BullMQ/Redis and a dedicated worker
- Zod validation and consistent API errors
- CPU metrics and supervisor-based restart support
- ESLint, Prettier, Husky, lint-staged, and Jest tests

## Architecture

```text
Route → validation → controller → service → MongoDB model

CSV/XLSX upload → worker thread → MongoDB
Scheduled message → MongoDB + Redis/BullMQ → message worker
```

## Prerequisites

- Node.js 20+
- npm 10+
- MongoDB Community Server 7+
- Redis 7+ or compatible server
- Postman (optional)
- Docker Desktop/Docker Engine (optional)

MongoDB Compass is only a GUI. It does not run MongoDB itself.

## Windows setup from scratch

### 1. Clone and install packages

```powershell
git clone https://github.com/YOUR_GITHUB_USERNAME/Insuredmine.git
cd Insuredmine
npm ci
Copy-Item .env.example .env
```

Review `.env` if your MongoDB or Redis host differs.

### 2. Start MongoDB

Install [MongoDB Community Server](https://www.mongodb.com/docs/manual/tutorial/install-mongodb-on-windows/) as a Windows service. Check it:

```powershell
Get-Service MongoDB
```

If needed, run PowerShell as Administrator:

```powershell
Start-Service MongoDB
```

Connect Compass with:

```text
mongodb://127.0.0.1:27017
```

### 3. Start Redis

Install a Windows-compatible Redis server:

```powershell
winget install --id taizod1024.redis-windows-fork
```

Open a new PowerShell window. In **Terminal A**, run and keep it open:

```powershell
redis-server --port 6379
```

If `redis-server` is not found, add the folder containing `redis-server.exe` to `PATH`, then open a new terminal. Verify Redis:

```powershell
redis-cli ping
```

Expected result: `PONG`.

### 4. Start the API

In **Terminal B**, from the project folder:

```powershell
npm run dev
```

The API listens on `http://localhost:3000`. It fails fast if MongoDB or Redis is unavailable.

### 5. Start the scheduled-message worker

In **Terminal C**, from the project folder:

```powershell
npm run worker:messages
```

This is required to process scheduled messages. CSV/XLSX imports start their own worker thread automatically.

### 6. Check readiness

```text
GET http://localhost:3000/health/ready
```

Expected response:

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Service dependencies are ready",
  "data": {
    "status": "ready",
    "dependencies": {
      "database": "connected",
      "redis": "connected"
    }
  }
}
```

## Linux setup from scratch

Install Node.js 20+ and MongoDB Community Server using the [official MongoDB Linux guide](https://www.mongodb.com/docs/manual/administration/install-on-linux/). On Ubuntu/Debian, install Redis with:

```bash
sudo apt update
sudo apt install redis-server
sudo systemctl enable --now redis-server
redis-cli ping
```

Clone the project:

```bash
git clone https://github.com/YOUR_GITHUB_USERNAME/Insuredmine.git
cd Insuredmine
npm ci
cp .env.example .env
```

Then run:

```bash
# Terminal A, only if MongoDB is not managed as a service
mongod
```

```bash
# Terminal B
npm run dev
```

```bash
# Terminal C
npm run worker:messages
```

The source uses cross-platform Node.js APIs and works on Linux. Uploaded-file audit paths naturally differ by OS but imported data remains compatible.

## Docker setup

Docker Compose starts the API, message worker, MongoDB, and Redis:

```bash
docker compose up --build
```

Check containers:

```bash
docker compose ps
```

Stop containers while keeping named volumes:

```bash
docker compose down
```

Compose provides container-only MongoDB/Redis URLs (`mongo` and `redis`). Do not copy local database URLs into Docker Compose. The image uses production dependencies, runs as non-root, and Docker Compose restarts the API after a high-CPU exit.

## Environment variables

Copy `.env.example` to `.env`. Never commit `.env`.

| Variable                | Default                                   | Purpose                                   |
| ----------------------- | ----------------------------------------- | ----------------------------------------- |
| `NODE_ENV`              | `development`                             | Runtime mode.                             |
| `PORT`                  | `3000`                                    | API port.                                 |
| `MONGODB_URI`           | `mongodb://127.0.0.1:27017/policy_import` | MongoDB connection.                       |
| `REDIS_URL`             | `redis://127.0.0.1:6379`                  | Redis/BullMQ connection.                  |
| `UPLOAD_DIR`            | `uploads`                                 | Uploaded-file audit storage.              |
| `MAX_FILE_SIZE_BYTES`   | `10485760`                                | Maximum upload size (10 MB).              |
| `CPU_THRESHOLD`         | `70`                                      | Process CPU percentage threshold.         |
| `CPU_CHECK_INTERVAL_MS` | `5000`                                    | CPU sampling interval.                    |
| `RESTART_ON_HIGH_CPU`   | `false`                                   | Enable only with a restart supervisor.    |
| `LOG_LEVEL`             | `info`                                    | Pino log level.                           |
| `CORS_ORIGINS`          | local web origins                         | Allowed browser origins, comma-separated. |

In production, `MONGODB_URI`, `REDIS_URL`, and `CORS_ORIGINS` are mandatory.

## Postman setup

1. In Postman click **Import**.
2. Import `postman/Insuredmine.postman_collection.json`.
3. Import `postman/Insuredmine.local.postman_environment.json`.
4. Select **Insuredmine Local** in the environment dropdown.
5. Confirm `baseUrl` is `http://localhost:3000`.
6. For **Upload CSV or XLSX**, choose a file at Body → form-data → `file`.
7. The request saves `data.jobId` into the selected environment as `importJobId`.
8. Use **Get Import Status** until `data.status` is `completed`, `failed`, or `duplicate`.

## API reference

All endpoints return a consistent envelope:

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Request completed successfully",
  "data": {}
}
```

Errors have `success: false` and field-level details in `errors` when applicable.

| Method | Endpoint                           | Notes                                                |
| ------ | ---------------------------------- | ---------------------------------------------------- |
| `GET`  | `/health`                          | API liveness.                                        |
| `GET`  | `/health/ready`                    | MongoDB and Redis readiness.                         |
| `GET`  | `/health/metrics`                  | Node CPU, memory, uptime, and restart configuration. |
| `POST` | `/api/imports`                     | Multipart `file`; accepts CSV/XLSX.                  |
| `GET`  | `/api/imports/:id`                 | Use upload response `data.jobId`.                    |
| `GET`  | `/api/policies/search`             | One of `firstName` or `email`, plus pagination.      |
| `GET`  | `/api/policies/aggregated-by-user` | Supports `page` and `limit` (maximum 100).           |
| `POST` | `/api/messages`                    | Schedules a BullMQ delayed job.                      |

First-name prefix search:

```text
GET /api/policies/search?firstName=jay&page=1&limit=20
```

Partial-email search:

```text
GET /api/policies/search?email=@gmail.com&page=1&limit=20
```

Send exactly one of `firstName` or `email`.

Preferred scheduled-message input, with timezone:

```json
{
  "message": "Renewal reminder",
  "scheduledFor": "2026-10-01T09:30:00+05:30"
}
```

Legacy day/time input remains supported:

```json
{
  "message": "Legacy reminder",
  "day": "2026-10-01",
  "time": "09:30"
}
```

The API creates a MongoDB record with `status: "pending"` and a delayed Redis job immediately. At the scheduled time, the message worker changes it to `sent`. It currently records/logs delivery; connect Twilio, SendGrid, Firebase, or a similar provider for real SMS/email/push delivery.

## CPU monitoring and restart behavior

The application samples **Node.js process CPU** every five seconds. Around `100` means one logical CPU core is fully busy; worker-thread activity can push the value above `100` on multi-core hosts.

After the API has run for at least five seconds, call:

```text
GET http://localhost:3000/health/metrics
```

Example response:

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Process metrics retrieved successfully",
  "data": {
    "processCpuPercent": 12.45,
    "thresholdPercent": 70,
    "checkIntervalMs": 5000,
    "restartEnabled": false
  }
}
```

At `CPU_THRESHOLD`, the app logs `CPU threshold reached`. With `RESTART_ON_HIGH_CPU=true`, it exits with code `1`; Docker, Nodemon, PM2, systemd, or Kubernetes must restart it. An app cannot safely restart itself in-process.

For a local-only restart demonstration, set `CPU_THRESHOLD=0` and `RESTART_ON_HIGH_CPU=true`, start with `npm run dev`, wait for Nodemon to restart it, then immediately restore the normal values. Never use that test configuration normally.

### Assessment requirement interpretation

“Track real-time CPU utilization of the node server and on 70% usage restart the server” means monitor the Node process, make its value observable, and hand a non-zero exit to a supervisor when it crosses the threshold. This project uses `/health/metrics` for visibility and Docker/Nodemon/other supervisors for restart.

“Create a post-service that takes the message, day, and time in body parameters and it inserts that message into DB at that particular day and time” is normally a scheduling requirement. This project saves the pending schedule immediately, then processes/delivers it at the requested time. If an assessor literally requires no document until the scheduled moment, ask for clarification; that is not typical scheduler behavior and prevents users from viewing pending schedules.

## Import, duplicates, and audits

- An identical file is flagged using a SHA-256 file hash.
- Same policy number plus same row hash is skipped.
- Changed policy rows update the policy and create `ChangeAudit` entries.
- Unknown spreadsheet columns remain in `Policy.sourceFields`.
- CSV rows are imported in 500-row batches in a worker thread.

## Quality commands

```bash
npm run format
npm run format:check
npm run lint
npm test
```
