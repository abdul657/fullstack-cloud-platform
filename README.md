# Full-Stack Cloud Platform

A portfolio-scale operations console demonstrating a typed React frontend, a Node.js/Express REST API, and PostgreSQL persistence. The sample domain is order operations: list records, create an order record, and move it through a small set of lifecycle states.

> Scope: This is an educational operations dashboard. It does not accept payments, store card data, integrate with a payment processor, or represent a production commerce platform.

## Technology
- Frontend: React, TypeScript, Vite
- Backend: Node.js, Express, TypeScript
- Database: PostgreSQL with parameterized SQL
- API quality: validation, Helmet security headers, configurable CORS, Vitest and Supertest
- Local infrastructure: Docker Compose for PostgreSQL
- CI: GitHub Actions build and API tests

## Architecture
~~~text
React + TypeScript (Vite)
        | HTTP / JSON
        v
Express + TypeScript API
        | parameterized SQL
        v
PostgreSQL
~~~

## Prerequisites
- Node.js 20 or later and npm
- Docker Desktop (recommended for local PostgreSQL)

## Run locally
1. Copy .env.example to .env. On Windows PowerShell: Copy-Item .env.example .env
2. Start PostgreSQL: docker compose up -d db
3. Install dependencies: npm install
4. Start both apps: npm run dev

- Frontend: http://localhost:5173
- Backend: http://localhost:4000
- Health check: http://localhost:4000/api/health

The Vite server proxies /api requests to Express.

## Build and test
~~~bash
npm run build
npm test
~~~

API tests use a mocked database pool and do not require PostgreSQL.

## API
Base path: /api

| Method | Endpoint | Description |
|---|---|---|
| GET | /health | Database readiness check |
| GET | /orders | List recent order records |
| POST | /orders | Create an order record |
| PATCH | /orders/:id/status | Update an order lifecycle state |

POST /orders example:
~~~json
{"customerName":"Example Customer","totalCents":1299}
~~~

Allowed states: pending, processing, fulfilled, and cancelled.

## Project layout
~~~text
apps/api/src/                 Express API, database pool and server
apps/api/tests/               API tests
apps/web/src/                 React application and typed API client
infra/db/init.sql              PostgreSQL schema and sample row
.github/workflows/ci.yml       Build and test workflow
.env.example
docker-compose.yml
package.json
~~~

## Engineering notes
- SQL values are passed as query parameters.
- API input is validated before writes.
- CORS is restricted to the configured frontend origin.
- The health endpoint checks database connectivity.
- Tests inject a mock pool for deterministic API testing.

## Deliberate scope and next steps
Authentication, role-based access, pagination, audit history, tracing, payment integration and cloud deployment are not implemented. They are potential extensions, not claimed features.

## License
No license is currently declared. Add one before accepting external contributions or permitting reuse.
