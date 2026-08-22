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
| Testing | Jest / Supertest |
| Package manager | npm |

The ORM will be selected while designing the data model. TypeORM and Prisma have intentionally not been added yet.

## Current foundation

- Standard NestJS project structure
- TypeScript strict mode
- Global API prefix: `/api/v1`
- CORS configuration for the frontend development server
- Health endpoint: `GET /api/v1/health`
- Environment variable template
- Unit and E2E tests

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

1. Design the data model and select an ORM
2. Add PostgreSQL connectivity and migrations
3. Implement authentication and token management
4. Implement job CRUD and status history
5. Add skill profiles and match score calculation
6. Add dashboard aggregation endpoints
