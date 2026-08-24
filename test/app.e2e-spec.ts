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

  afterEach(async () => {
    await app.close();
  });
});
