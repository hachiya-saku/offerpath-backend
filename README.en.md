# OfferPath Backend

[![CI](https://github.com/hachiya-saku/offerpath-backend/actions/workflows/ci.yml/badge.svg)](https://github.com/hachiya-saku/offerpath-backend/actions/workflows/ci.yml)

[日本語](README.md) | [简体中文](README.zh-CN.md) | [English](README.en.md)

OfferPath Backend is the REST API for the OfferPath job application management platform. It will manage jobs, application status, skill profiles, match scores, and authentication.

Frontend repository: [offerpath-frontend](https://github.com/hachiya-saku/offerpath-frontend)

## Tech stack

| Category | Technology |
| --- | --- |
| Runtime | Node.js 24 |
| Framework | NestJS 11 |
| Language | TypeScript |
| Database | PostgreSQL 18 |
| ORM | Prisma 7 |
| Testing | Jest / Supertest |
| Package manager | npm |

Prisma migrations and seed scripts manage the PostgreSQL schema and local development data.

## Current foundation

- Standard NestJS project structure
- TypeScript strict mode
- Global API prefix: `/api/v1`
- CORS configuration for the frontend development server
- Health endpoint: `GET /api/v1/health`
- User, RefreshSession, Company, and Job models with database migrations
- Company CRUD API
- Complete Job CRUD APIs
- Email registration, password login, access/refresh token rotation, and multi-device sessions
- JWT authentication, per-user isolation, current-device logout, and profile APIs
- Interview scheduling, listing, and transactional job status updates
- Job status corrections, change history, and undo for mistaken interview progression
- Unit and E2E tests with Jest and Supertest

## API

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/v1/health` | Health check |
| `POST` | `/api/v1/auth/register` | Register a user |
| `POST` | `/api/v1/auth/login` | Log in and create an independent device session |
| `POST` | `/api/v1/auth/refresh` | Rotate the current session's token pair |
| `POST` | `/api/v1/auth/logout` | Log out the current device session |
| `GET` | `/api/v1/users/me` | Get the current user profile |
| `PATCH` | `/api/v1/users/me` | Update the current user profile |
| `GET` | `/api/v1/companies` | List companies |
| `POST` | `/api/v1/companies` | Create a company |
| `PATCH` | `/api/v1/companies/:id` | Update a company |
| `DELETE` | `/api/v1/companies/:id` | Delete a company |
| `POST` | `/api/v1/jobs` | Create a job and resolve its company |
| `GET` | `/api/v1/jobs` | List jobs |
| `GET` | `/api/v1/jobs/:id` | Get job details |
| `PATCH` | `/api/v1/jobs/:id` | Update a job |
| `DELETE` | `/api/v1/jobs/:id` | Delete a job |
| `POST` | `/api/v1/jobs/:id/interviews` | Schedule the next interview and advance status |
| `GET` | `/api/v1/interviews` | List interview schedules |
| `PATCH` | `/api/v1/jobs/:id/status` | Correct a job status and record the reason |
| `GET` | `/api/v1/jobs/:id/status-history` | List job status history |
| `DELETE` | `/api/v1/jobs/:id/interviews/:interviewId/undo` | Undo the latest interview progression |

Business endpoints require an Access Token and isolate data by the current JWT user. Each login creates an independent Refresh Session, allowing desktop and mobile sessions to coexist; refresh and logout affect only the current device.

## Setup

```bash
npm install
```

Create `.env` from `.env.example` and provide the local PostgreSQL connection details.

```env
PORT=3000
FRONTEND_URL=http://localhost:5173
DATABASE_URL=postgresql://postgres:password@localhost:5432/offerpath
JWT_ACCESS_SECRET=replace-with-a-long-random-secret
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_SECRET=replace-with-another-long-random-secret
JWT_REFRESH_EXPIRES_IN=7d
```

```bash
npm run start:dev
```

The API runs at `http://localhost:3000` by default.

## Verification

```bash
npm run build
npm run lint
npm test
npm run test:e2e
```

## Planned development

1. Add job search, filtering, and pagination
2. Add interview detail, editing, and deletion
3. Add skill profiles and match score calculation
4. Add dashboard aggregation endpoints
5. Add structured parsing from job URLs
