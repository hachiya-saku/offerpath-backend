import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';
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
  let accessToken: string;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
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
    const jwtService = app.get(JwtService);
    const configService = app.get(ConfigService);
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
    accessToken = await jwtService.signAsync(
      {
        sub: DEMO_USER_ID,
        email: DEMO_USER_EMAIL,
        sessionId: '00000000-0000-4000-8000-000000000002',
      },
      {
        secret: configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
      },
    );
  });

  it('/api/v1/health (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/v1/health')
      .expect(200)
      .expect({ status: 'ok', service: 'offerpath-backend' });
  });

  it('/api/v1/auth keeps device sessions independent during refresh and logout', async () => {
    const email = `auth-e2e-${Date.now()}@example.com`;
    const password = 'password123';
    let userId: string | undefined;

    try {
      const registerResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email,
          password,
          displayName: 'Auth E2E User',
        })
        .expect(201);
      userId = (registerResponse.body as { id: string }).id;

      const firstDevice = request.agent(app.getHttpServer());
      const secondDevice = request.agent(app.getHttpServer());

      const firstLoginResponse = await firstDevice
        .post('/api/v1/auth/login')
        .send({ email, password })
        .expect(200);
      const firstLoginTokens = firstLoginResponse.body as {
        accessToken: string;
      };
      expect(firstLoginResponse.body).not.toHaveProperty('refreshToken');
      expect(firstLoginResponse.headers['set-cookie']).toEqual(
        expect.arrayContaining([
          expect.stringMatching(/refreshToken=.*HttpOnly/),
        ]),
      );

      const secondLoginResponse = await secondDevice
        .post('/api/v1/auth/login')
        .send({ email, password })
        .expect(200);
      expect(secondLoginResponse.body).not.toHaveProperty('refreshToken');

      expect(await prisma.refreshSession.count({ where: { userId } })).toBe(2);

      const firstRefreshResponse = await firstDevice
        .post('/api/v1/auth/refresh')
        .expect(200);
      const firstRefreshedTokens = firstRefreshResponse.body as {
        accessToken: string;
      };

      expect(firstRefreshedTokens.accessToken).not.toBe(
        firstLoginTokens.accessToken,
      );
      expect(firstRefreshResponse.body).not.toHaveProperty('refreshToken');

      await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .expect(401);

      await secondDevice.post('/api/v1/auth/refresh').expect(200);

      await firstDevice
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${firstRefreshedTokens.accessToken}`)
        .expect(200)
        .expect({ message: 'Logged out successfully' });

      await firstDevice.post('/api/v1/auth/refresh').expect(401);

      await secondDevice.post('/api/v1/auth/refresh').expect(200);

      expect(await prisma.refreshSession.count({ where: { userId } })).toBe(1);
    } finally {
      if (userId) {
        await prisma.user.deleteMany({ where: { id: userId } });
      }
    }
  });

  it('/api/v1/users/me gets and updates only the current user profile', async () => {
    const email = `profile-e2e-${Date.now()}@example.com`;
    const password = 'password123';
    let userId: string | undefined;

    try {
      const registerResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({ email, password, displayName: 'Profile E2E User' })
        .expect(201);
      userId = (registerResponse.body as { id: string }).id;

      const loginResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email, password })
        .expect(200);
      const { accessToken: profileAccessToken } = loginResponse.body as {
        accessToken: string;
      };

      await request(app.getHttpServer()).get('/api/v1/users/me').expect(401);

      const profileResponse = await request(app.getHttpServer())
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${profileAccessToken}`)
        .expect(200);
      expect(profileResponse.body).toMatchObject({
        id: userId,
        email,
        displayName: 'Profile E2E User',
        bio: null,
        location: null,
        avatarUrl: null,
      });
      expect(profileResponse.body).not.toHaveProperty('passwordCredential');

      const updateResponse = await request(app.getHttpServer())
        .patch('/api/v1/users/me')
        .set('Authorization', `Bearer ${profileAccessToken}`)
        .send({
          displayName: 'Updated Profile User',
          bio: 'Frontend engineer',
          location: 'Tokyo, Japan',
          avatarUrl: 'https://example.com/avatar.png',
        })
        .expect(200);
      expect(updateResponse.body).toMatchObject({
        id: userId,
        email,
        displayName: 'Updated Profile User',
        bio: 'Frontend engineer',
        location: 'Tokyo, Japan',
        avatarUrl: 'https://example.com/avatar.png',
      });

      await request(app.getHttpServer())
        .patch('/api/v1/users/me')
        .set('Authorization', `Bearer ${profileAccessToken}`)
        .send({ email: 'forbidden@example.com' })
        .expect(400);
    } finally {
      if (userId) {
        await prisma.user.deleteMany({ where: { id: userId } });
      }
    }
  });

  it('/api/v1/companies (POST) rejects invalid data', () => {
    return request(app.getHttpServer())
      .post('/api/v1/companies')
      .set('Authorization', `Bearer ${accessToken}`)
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
      .set('Authorization', `Bearer ${accessToken}`)
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
        .set('Authorization', `Bearer ${accessToken}`)
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
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'E2E Update Company',
      })
      .expect(201);

    const companyId = (createResponse.body as { id: string }).id;

    try {
      const updateResponse = await request(app.getHttpServer())
        .patch(`/api/v1/companies/${companyId}`)
        .set('Authorization', `Bearer ${accessToken}`)
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
        .set('Authorization', `Bearer ${accessToken}`)
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
        .set('Authorization', `Bearer ${accessToken}`)
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

      await request(app.getHttpServer()).get('/api/v1/jobs').expect(401);

      const listResponse = await request(app.getHttpServer())
        .get('/api/v1/jobs')
        .set('Authorization', `Bearer ${accessToken}`)
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
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
      const jobDetail = detailResponse.body as {
        id: string;
        company: { name: string };
      };

      expect(jobDetail.id).toBe(jobId);
      expect(jobDetail.company.name).toBe(companyName);

      const updateResponse = await request(app.getHttpServer())
        .patch(`/api/v1/jobs/${jobId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          positionName: 'Senior Frontend Engineer',
        })
        .expect(200);

      expect(updateResponse.body).toMatchObject({
        id: jobId,
        positionName: 'Senior Frontend Engineer',
        status: 'WISHLIST',
      });

      const deleteResponse = await request(app.getHttpServer())
        .delete(`/api/v1/jobs/${jobId}`)
        .set('Authorization', `Bearer ${accessToken}`)
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
        .set('Authorization', `Bearer ${accessToken}`)
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
        .set('Authorization', `Bearer ${accessToken}`)
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
        .set('Authorization', `Bearer ${accessToken}`)
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
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
      const interviews = listResponse.body as Array<{ id: string }>;
      expect(interviews.some((item) => item.id === interview.id)).toBe(true);

      const undoResponse = await request(app.getHttpServer())
        .delete(`/api/v1/jobs/${jobId}/interviews/${interview.id}/undo`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
      expect(undoResponse.body).toMatchObject({
        id: jobId,
        status: 'DOCUMENT_SCREENING',
      });

      const correctionResponse = await request(app.getHttpServer())
        .patch(`/api/v1/jobs/${jobId}/status`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          status: 'FIRST_INTERVIEW',
          reason: 'E2E status correction',
        })
        .expect(200);
      expect(correctionResponse.body).toMatchObject({
        id: jobId,
        status: 'FIRST_INTERVIEW',
      });

      const historyResponse = await request(app.getHttpServer())
        .get(`/api/v1/jobs/${jobId}/status-history`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
      const history = historyResponse.body as Array<{
        changeType: string;
        reason?: string;
      }>;
      expect(history).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ changeType: 'ADVANCE' }),
          expect.objectContaining({ changeType: 'UNDO' }),
          expect.objectContaining({
            changeType: 'CORRECTION',
            reason: 'E2E status correction',
          }),
        ]),
      );
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
