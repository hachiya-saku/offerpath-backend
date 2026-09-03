import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { hash } from 'bcryptjs';
import { PrismaClient } from '../generated/prisma/client';
import {
  InterviewMode,
  JobSkillKind,
  JobStatus,
  JobStatusChangeType,
  SkillLevel,
} from '../generated/prisma/enums';
import {
  DEMO_USER_EMAIL,
  DEMO_USER_ID,
} from '../src/common/constants/demo-user';

const DEMO_PASSWORD = 'offerpath2026';
const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error('DATABASE_URL is not set');

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString, options: '-c timezone=UTC' }),
});

const companies = [
  {
    name: 'Layer Nine株式会社',
    website: 'https://example.com',
    industry: 'SaaS / HR Tech',
    size: '51〜100名',
    location: '東京都渋谷区',
    description:
      '採用業務と人材配置を支援するB2B SaaSを開発するプロダクト企業。',
    notes: '技術面接では設計判断とチーム開発の経験を重点的に確認する。',
  },
  {
    name: 'Northstar Labs',
    website: 'https://example.com',
    industry: 'Software / AI',
    size: '11〜50名',
    location: '東京都港区',
    description: 'AIを活用した業務支援プロダクトを開発するスタートアップ。',
    notes: '英語を使用する機会あり。リモート勤務制度を確認する。',
  },
  {
    name: '株式会社モノリス',
    industry: 'Webサービス',
    size: '101〜300名',
    location: '神奈川県横浜市',
    description: '企業向けWebサービスの企画・開発・運用を行う。',
  },
  {
    name: 'Orbit Works',
    website: 'https://example.com',
    industry: 'Design Technology',
    size: '11〜50名',
    location: 'フルリモート',
    description: 'デザインシステムとアクセシビリティを重視した開発組織。',
  },
  {
    name: 'Data Loom株式会社',
    industry: 'Data Platform',
    size: '51〜100名',
    location: '東京都千代田区',
    description: 'データ活用基盤と可視化プロダクトを提供する企業。',
  },
  {
    name: 'Cloud Harbor',
    industry: 'Cloud Services',
    size: '101〜300名',
    location: '大阪府大阪市',
    description: 'クラウド導入と業務システム開発を支援するIT企業。',
  },
] as const;

const jobs = [
  {
    id: '10000000-0000-4000-8000-000000000001',
    company: 'Layer Nine株式会社',
    positionName: 'フロントエンドエンジニア',
    platform: 'Green',
    location: '東京都・ハイブリッド',
    salaryMin: 500,
    salaryMax: 750,
    status: JobStatus.SECOND_INTERVIEW,
    matchScore: 88,
    updatedAt: '2026-09-03T14:20:00+09:00',
    required: ['React', 'TypeScript', 'REST API'],
    bonus: ['Next.js', 'E2E', 'デザインシステム'],
    notes:
      'プロダクトチームとの二次面接。設計判断とチーム開発について準備する。',
  },
  {
    id: '10000000-0000-4000-8000-000000000002',
    company: 'Northstar Labs',
    positionName: 'Frontend Developer',
    platform: 'Wantedly',
    location: '東京・リモート可',
    salaryMin: 550,
    salaryMax: 800,
    status: JobStatus.FIRST_INTERVIEW,
    matchScore: 82,
    updatedAt: '2026-09-02T18:40:00+09:00',
    required: ['React', 'TypeScript', 'CSS'],
    bonus: ['GraphQL', 'Storybook'],
    notes: 'カジュアル面談済み。開発文化とコードレビューについて確認したい。',
  },
  {
    id: '10000000-0000-4000-8000-000000000003',
    company: '株式会社モノリス',
    positionName: 'Webアプリケーションエンジニア',
    platform: '企業サイト',
    location: '神奈川県',
    salaryMin: 480,
    salaryMax: 680,
    status: JobStatus.DOCUMENT_SCREENING,
    matchScore: 76,
    updatedAt: '2026-08-17T12:00:00+09:00',
    required: ['JavaScript', 'React', 'Git'],
    bonus: ['Node.js', 'AWS'],
    notes: 'ポートフォリオ提出済み。',
  },
  {
    id: '10000000-0000-4000-8000-000000000004',
    company: 'Orbit Works',
    positionName: 'UI Engineer',
    platform: 'LinkedIn',
    location: 'フルリモート',
    salaryMin: 600,
    salaryMax: 900,
    status: JobStatus.WISHLIST,
    matchScore: 91,
    updatedAt: '2026-08-16T12:00:00+09:00',
    required: ['React', 'TypeScript', 'Accessibility'],
    bonus: ['Figma', 'Design Tokens'],
    notes: '英語の職務経歴書を整えてから応募する。',
  },
  {
    id: '10000000-0000-4000-8000-000000000005',
    company: 'Data Loom株式会社',
    positionName: 'プロダクトエンジニア',
    platform: 'Green',
    location: '東京都',
    salaryMin: 500,
    salaryMax: 700,
    status: JobStatus.APPLIED,
    matchScore: 69,
    updatedAt: '2026-08-24T12:00:00+09:00',
    required: ['React', 'SQL', 'API Design'],
    bonus: ['Python', 'Data Visualization'],
    notes: '応募完了。返信待ち。',
  },
  {
    id: '10000000-0000-4000-8000-000000000006',
    company: 'Cloud Harbor',
    positionName: 'Frontend Engineer',
    platform: 'Indeed',
    location: '大阪府',
    salaryMin: 450,
    salaryMax: 650,
    status: JobStatus.REJECTED,
    matchScore: 61,
    updatedAt: '2026-08-10T12:00:00+09:00',
    required: ['Vue', 'JavaScript'],
    bonus: ['React', 'Docker'],
    notes: '書類選考で終了。Vueの実務経験が不足。',
  },
] as const;

const userSkills = [
  ['React', SkillLevel.PROFICIENT, '2年', 'purple'],
  ['TypeScript', SkillLevel.INTERMEDIATE, '1年', 'blue'],
  ['JavaScript', SkillLevel.PROFICIENT, '3年', 'green'],
  ['CSS / Tailwind', SkillLevel.INTERMEDIATE, '2年', 'pink'],
  ['Node.js', SkillLevel.BEGINNER, '6个月', 'amber'],
  ['PostgreSQL', SkillLevel.BEGINNER, '学习中', 'cyan'],
] as const;

async function main() {
  const passwordHash = await hash(DEMO_PASSWORD, 12);
  const user = await prisma.user.upsert({
    where: { email: DEMO_USER_EMAIL },
    update: {
      displayName: 'Hachiya Saku',
      bio: '志望成为前端工程师，主要学习 React / TypeScript。',
      location: 'Tokyo, Japan',
    },
    create: {
      id: DEMO_USER_ID,
      email: DEMO_USER_EMAIL,
      displayName: 'Hachiya Saku',
      bio: '志望成为前端工程师，主要学习 React / TypeScript。',
      location: 'Tokyo, Japan',
    },
  });
  await prisma.passwordCredential.upsert({
    where: { userId: user.id },
    update: { passwordHash },
    create: { userId: user.id, passwordHash },
  });

  await prisma.refreshSession.deleteMany({ where: { userId: user.id } });
  await prisma.job.deleteMany({ where: { company: { userId: user.id } } });
  await prisma.company.deleteMany({ where: { userId: user.id } });
  await prisma.userSkill.deleteMany({ where: { userId: user.id } });

  const companyIds = new Map<string, string>();
  for (const company of companies) {
    const created = await prisma.company.create({
      data: {
        userId: user.id,
        normalizedName: company.name.toLowerCase(),
        ...company,
      },
    });
    companyIds.set(company.name, created.id);
  }

  const skillNames = new Set([
    ...userSkills.map(([name]) => name),
    ...jobs.flatMap((job) => [...job.required, ...job.bonus]),
  ]);
  const skillIds = new Map<string, string>();
  for (const name of skillNames) {
    const normalizedName = name.trim().toLowerCase();
    const skill = await prisma.skill.upsert({
      where: { normalizedName },
      update: { name },
      create: { name, normalizedName },
    });
    skillIds.set(name, skill.id);
  }

  for (const [name, level, yearsLabel, color] of userSkills) {
    await prisma.userSkill.create({
      data: {
        userId: user.id,
        skillId: skillIds.get(name)!,
        level,
        yearsLabel,
        color,
      },
    });
  }

  for (const [index, job] of jobs.entries()) {
    await prisma.job.create({
      data: {
        id: job.id,
        companyId: companyIds.get(job.company)!,
        positionName: job.positionName,
        platform: job.platform,
        location: job.location,
        salaryMin: job.salaryMin,
        salaryMax: job.salaryMax,
        salaryCurrency: 'JPY',
        matchScore: job.matchScore,
        url: `https://example.com/jobs/${index + 1}`,
        status: job.status,
        notes: job.notes,
        updatedAt: new Date(job.updatedAt),
        skills: {
          create: [
            ...job.required.map((name) => ({
              skillId: skillIds.get(name)!,
              kind: JobSkillKind.REQUIRED,
            })),
            ...job.bonus.map((name) => ({
              skillId: skillIds.get(name)!,
              kind: JobSkillKind.BONUS,
            })),
          ],
        },
      },
    });
  }

  await prisma.interview.createMany({
    data: [
      {
        id: '20000000-0000-4000-8000-000000000001',
        jobId: jobs[1].id,
        round: JobStatus.FIRST_INTERVIEW,
        previousJobStatus: JobStatus.DOCUMENT_SCREENING,
        mode: InterviewMode.ONLINE,
        scheduledAt: new Date('2026-09-03T10:30:00+09:00'),
        platform: 'Zoom',
        meetingUrl: 'https://zoom.us/j/1234567890',
        meetingId: '123 456 7890',
        meetingPassword: 'offerpath',
        notes: 'プロダクト責任者との面接。開発経験と志望動機を整理しておく。',
      },
      {
        id: '20000000-0000-4000-8000-000000000002',
        jobId: jobs[0].id,
        round: JobStatus.SECOND_INTERVIEW,
        previousJobStatus: JobStatus.FIRST_INTERVIEW,
        mode: InterviewMode.OFFLINE,
        scheduledAt: new Date('2026-09-08T14:00:00+09:00'),
        location: '東京都渋谷区渋谷2丁目24-12 渋谷スクランブルスクエア',
        notes: '受付で面接担当者の名前を伝える。職務経歴書を持参。',
      },
      {
        id: '20000000-0000-4000-8000-000000000003',
        jobId: jobs[4].id,
        round: JobStatus.FIRST_INTERVIEW,
        previousJobStatus: JobStatus.APPLIED,
        mode: InterviewMode.ONLINE,
        scheduledAt: new Date('2026-08-24T11:00:00+09:00'),
        platform: 'Google Meet',
        meetingUrl: 'https://meet.google.com/abc-defg-hij',
        notes: '一次面接終了。技術スタックとチーム開発について確認した。',
      },
    ],
  });

  await prisma.jobStatusHistory.createMany({
    data: [
      {
        id: '30000000-0000-4000-8000-000000000001',
        jobId: jobs[1].id,
        fromStatus: JobStatus.DOCUMENT_SCREENING,
        toStatus: JobStatus.FIRST_INTERVIEW,
        changeType: JobStatusChangeType.ADVANCE,
        createdAt: new Date('2026-09-01T10:00:00+09:00'),
      },
      {
        id: '30000000-0000-4000-8000-000000000002',
        jobId: jobs[0].id,
        fromStatus: JobStatus.FIRST_INTERVIEW,
        toStatus: JobStatus.SECOND_INTERVIEW,
        changeType: JobStatusChangeType.ADVANCE,
        createdAt: new Date('2026-09-02T14:20:00+09:00'),
      },
      {
        id: '30000000-0000-4000-8000-000000000003',
        jobId: jobs[4].id,
        fromStatus: JobStatus.APPLIED,
        toStatus: JobStatus.FIRST_INTERVIEW,
        changeType: JobStatusChangeType.ADVANCE,
        createdAt: new Date('2026-08-24T11:00:00+09:00'),
      },
      {
        id: '30000000-0000-4000-8000-000000000004',
        jobId: jobs[4].id,
        fromStatus: JobStatus.FIRST_INTERVIEW,
        toStatus: JobStatus.APPLIED,
        changeType: JobStatusChangeType.CORRECTION,
        reason: '前端 Mock 数据の応募済み状態を維持',
        createdAt: new Date('2026-08-24T12:00:00+09:00'),
      },
    ],
  });

  console.log(`Seeded demo account: ${user.email} / ${DEMO_PASSWORD}`);
  console.log('Seeded 6 companies, 6 jobs, 3 interviews, and skill data.');
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
