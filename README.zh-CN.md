# OfferPath Backend

[日本語](README.md) | [简体中文](README.zh-CN.md) | [English](README.en.md)

OfferPath Backend 是求职岗位管理平台 OfferPath 的 REST API 服务，用于管理岗位信息、投递状态、个人技术栈、匹配度和用户认证等数据。

前端仓库：[offerpath-frontend](https://github.com/hachiya-saku/offerpath-frontend)

## 技术栈

| 分类 | 技术 |
| --- | --- |
| 运行时 | Node.js 24 |
| 后端框架 | NestJS 11 |
| 语言 | TypeScript |
| 数据库 | PostgreSQL 18 |
| 测试 | Jest / Supertest |
| 包管理 | npm |

ORM 将在设计数据模型时确定，目前没有擅自引入 TypeORM 或 Prisma。

## 当前完成

- NestJS 基础项目
- TypeScript strict 模式
- API 前缀：`/api/v1`
- 面向前端开发环境的 CORS 配置
- 健康检查：`GET /api/v1/health`
- 环境变量示例
- 单元测试与 E2E 测试

## 本地运行

```bash
npm install
```

参考 `.env.example` 创建 `.env`，填写本机 PostgreSQL 连接信息：

```env
PORT=3000
FRONTEND_URL=http://localhost:5173
DATABASE_URL=postgresql://postgres:password@localhost:5432/offerpath
```

```bash
npm run start:dev
```

默认服务地址为 `http://localhost:3000`。

## 常用命令

```bash
npm run build
npm run lint
npm test
npm run test:e2e
```

## 后续开发顺序

1. 设计数据模型并选择 ORM
2. 接入 PostgreSQL 与数据库迁移
3. 用户认证和 Token 管理
4. 岗位 CRUD 与状态变更历史
5. 技术栈档案与匹配度计算
6. 仪表盘统计接口
