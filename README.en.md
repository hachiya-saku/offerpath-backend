# OfferPath Backend

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
- User, Company, and Job models with database migrations
- Company CRUD API
- Job create, list, detail, and update APIs
- Unit and E2E tests with Jest and Supertest

## API

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/v1/health` | Health check |
| `GET` | `/api/v1/companies` | List companies |
| `POST` | `/api/v1/companies` | Create a company |
| `PATCH` | `/api/v1/companies/:id` | Update a company |
| `DELETE` | `/api/v1/companies/:id` | Delete a company |
| `POST` | `/api/v1/jobs` | Create a job and resolve its company |
| `GET` | `/api/v1/jobs` | List jobs |
| `GET` | `/api/v1/jobs/:id` | Get job details |
| `PATCH` | `/api/v1/jobs/:id` | Update a job |

Authentication is not connected yet, so user-scoped endpoints currently use the seeded demo user.

## Setup

```bash
npm install
```

Create `.env` from `.env.example` and provide the local PostgreSQL connection details.

```env
PORT=3000
FRONTEND_URL=http://localhost:5173
DATABASE_URL=postgresql://postgres:password@localhost:5432/offerpath
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

1. Add the job deletion API and Job E2E coverage
2. Implement authentication and token management
3. Add job search, filtering, and pagination
4. Add application status history
5. Add skill profiles and match score calculation
6. Add dashboard aggregation endpoints
