import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';
import {
  DEMO_USER_ID,
  DEMO_USER_EMAIL,
} from '../src/common/constants/demo-user';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    app.setGlobalPrefix('api/v1');
    await app.init();
    prisma = app.get(PrismaService);
    await prisma.user.upsert({
      where: {
        email: DEMO_USER_EMAIL,
      },
      update: {
        id: DEMO_USER_ID,
      },
      create: {
        id: DEMO_USER_ID,
        email: DEMO_USER_EMAIL,
        displayName: 'OfferPath Demo User',
      },
    });
  });

  it('/api/v1/health (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/v1/health')
      .expect(200)
      .expect({ status: 'ok', service: 'offerpath-backend' });
  });

  it('/api/v1/companies (POST) rejects invalid data', () => {
    return request(app.getHttpServer())
      .post('/api/v1/companies')
      .send({
        name: '',
        website: 'not-a-url',
        unexpected: true,
      })
      .expect(400);
  });

  it('/api/v1/companies (POST, GET) creates and lists a company', async () => {
    const createResponse = await request(app.getHttpServer())
      .post('/api/v1/companies')
      .send({
        name: 'E2E Test Company',
        website: 'https://example.com',
        notes: 'Created by E2E test',
      })
      .expect(201);

    const companyId = (createResponse.body as { id: string }).id;

    try {
      expect(createResponse.body).toMatchObject({
        userId: DEMO_USER_ID,
        name: 'E2E Test Company',
        website: 'https://example.com',
        notes: 'Created by E2E test',
      });

      const listResponse = await request(app.getHttpServer())
        .get('/api/v1/companies')
        .expect(200);

      expect(listResponse.body).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: companyId,
            name: 'E2E Test Company',
          }),
        ]),
      );
    } finally {
      await prisma.company.delete({
        where: {
          id: companyId,
        },
      });
    }
  });

  it('/api/v1/companies/:id (PATCH, DELETE) updates and deletes a company', async () => {
    const createResponse = await request(app.getHttpServer())
      .post('/api/v1/companies')
      .send({
        name: 'E2E Update Company',
      })
      .expect(201);

    const companyId = (createResponse.body as { id: string }).id;

    try {
      const updateResponse = await request(app.getHttpServer())
        .patch(`/api/v1/companies/${companyId}`)
        .send({
          name: 'E2E Updated Company',
          notes: 'Updated by E2E test',
        })
        .expect(200);

      expect(updateResponse.body).toMatchObject({
        id: companyId,
        name: 'E2E Updated Company',
        notes: 'Updated by E2E test',
      });

      const deleteResponse = await request(app.getHttpServer())
        .delete(`/api/v1/companies/${companyId}`)
        .expect(200);

      expect(deleteResponse.body).toMatchObject({
        id: companyId,
        name: 'E2E Updated Company',
      });
    } finally {
      await prisma.company.deleteMany({
        where: {
          id: companyId,
          userId: DEMO_USER_ID,
        },
      });
    }
  });

  it('/api/v1/jobs completes the job CRUD lifecycle', async () => {
    const companyName = `E2E Job Company ${Date.now()}`;
    let companyId: string | undefined;
    let jobId: string | undefined;

    try {
      const createResponse = await request(app.getHttpServer())
        .post('/api/v1/jobs')
        .send({
          companyName,
          positionName: 'Frontend Engineer',
          platform: 'Green',
          location: 'Tokyo',
          salaryMin: 500,
          salaryMax: 700,
          salaryCurrency: 'JPY',
          status: 'WISHLIST',
        })
        .expect(201);

      jobId = (createResponse.body as { id: string }).id;
      companyId = (createResponse.body as { companyId: string }).companyId;

      expect(createResponse.body).toMatchObject({
        id: jobId,
        companyId,
        positionName: 'Frontend Engineer',
        status: 'WISHLIST',
      });

      const listResponse = await request(app.getHttpServer())
        .get('/api/v1/jobs')
        .expect(200);
      const listedJobs = listResponse.body as Array<{
        id: string;
        company: { name: string };
      }>;

      expect(
        listedJobs.some(
          (job) => job.id === jobId && job.company.name === companyName,
        ),
      ).toBe(true);

      const detailResponse = await request(app.getHttpServer())
        .get(`/api/v1/jobs/${jobId}`)
        .expect(200);
      const jobDetail = detailResponse.body as {
        id: string;
        company: { name: string };
      };

      expect(jobDetail.id).toBe(jobId);
      expect(jobDetail.company.name).toBe(companyName);

      const updateResponse = await request(app.getHttpServer())
        .patch(`/api/v1/jobs/${jobId}`)
        .send({
          positionName: 'Senior Frontend Engineer',
          status: 'APPLIED',
        })
        .expect(200);

      expect(updateResponse.body).toMatchObject({
        id: jobId,
        positionName: 'Senior Frontend Engineer',
        status: 'APPLIED',
      });

      const deleteResponse = await request(app.getHttpServer())
        .delete(`/api/v1/jobs/${jobId}`)
        .expect(200);
      const deletedJob = deleteResponse.body as {
        id: string;
        positionName: string;
      };

      expect(deletedJob).toMatchObject({
        id: jobId,
        positionName: 'Senior Frontend Engineer',
      });
      jobId = undefined;

      await request(app.getHttpServer())
        .get(`/api/v1/jobs/${deletedJob.id}`)
        .expect(404);
    } finally {
      if (jobId) {
        await prisma.job.deleteMany({ where: { id: jobId } });
      }
      if (companyId) {
        await prisma.company.deleteMany({
          where: { id: companyId, userId: DEMO_USER_ID },
        });
      }
    }
  });

  it('/api/v1/jobs/:jobId/interviews schedules and lists an interview', async () => {
    let companyId: string | undefined;
    let jobId: string | undefined;

    try {
      const jobResponse = await request(app.getHttpServer())
        .post('/api/v1/jobs')
        .send({
          companyName: `E2E Interview Company ${Date.now()}`,
          positionName: 'Frontend Engineer',
          platform: 'Green',
          status: 'DOCUMENT_SCREENING',
        })
        .expect(201);
      const createdJob = jobResponse.body as {
        id: string;
        companyId: string;
      };
      jobId = createdJob.id;
      companyId = createdJob.companyId;

      const interviewResponse = await request(app.getHttpServer())
        .post(`/api/v1/jobs/${jobId}/interviews`)
        .send({
          round: 'FINAL_INTERVIEW',
          mode: 'OFFLINE',
          scheduledAt: '2026-09-15T14:00:00+09:00',
          location: '東京都千代田区丸の内1丁目',
        })
        .expect(201);
      const interview = interviewResponse.body as {
        id: string;
        jobId: string;
        round: string;
        mode: string;
      };

      expect(interview).toMatchObject({
        jobId,
        round: 'FINAL_INTERVIEW',
        mode: 'OFFLINE',
      });

      const updatedJob = await prisma.job.findUnique({ where: { id: jobId } });
      expect(updatedJob?.status).toBe('FINAL_INTERVIEW');

      const listResponse = await request(app.getHttpServer())
        .get('/api/v1/interviews')
        .expect(200);
      const interviews = listResponse.body as Array<{ id: string }>;
      expect(interviews.some((item) => item.id === interview.id)).toBe(true);
    } finally {
      if (jobId) await prisma.job.deleteMany({ where: { id: jobId } });
      if (companyId) {
        await prisma.company.deleteMany({
          where: { id: companyId, userId: DEMO_USER_ID },
        });
      }
    }
  });

  afterEach(async () => {
    await app.close();
  });
});
