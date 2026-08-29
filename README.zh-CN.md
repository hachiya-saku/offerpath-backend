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
| ORM | Prisma 7 |
| 测试 | Jest / Supertest |
| 包管理 | npm |

项目通过 Prisma 迁移和种子脚本管理 PostgreSQL 表结构与本地开发数据。

## 当前完成

- NestJS 基础项目
- TypeScript strict 模式
- API 前缀：`/api/v1`
- 面向前端开发环境的 CORS 配置
- 健康检查：`GET /api/v1/health`
- User / Company / Job 数据模型与迁移
- Company CRUD 接口
- Job 完整 CRUD 接口
- 邮箱注册、密码登录与 Access Token 签发
- Jest 单元测试与 Supertest E2E 测试

## API

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `GET` | `/api/v1/health` | 健康检查 |
| `POST` | `/api/v1/auth/register` | 用户注册 |
| `POST` | `/api/v1/auth/login` | 登录并签发 Access Token |
| `GET` | `/api/v1/companies` | 公司列表 |
| `POST` | `/api/v1/companies` | 创建公司 |
| `PATCH` | `/api/v1/companies/:id` | 更新公司 |
| `DELETE` | `/api/v1/companies/:id` | 删除公司 |
| `POST` | `/api/v1/jobs` | 创建岗位（查找或自动创建公司） |
| `GET` | `/api/v1/jobs` | 岗位列表 |
| `GET` | `/api/v1/jobs/:id` | 岗位详情 |
| `PATCH` | `/api/v1/jobs/:id` | 更新岗位 |
| `DELETE` | `/api/v1/jobs/:id` | 删除岗位 |

Company / Job 接口尚未接入认证守卫，因此当前仍使用种子数据中的演示用户。

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

1. Refresh Token、退出登录与认证守卫
2. 岗位搜索、筛选与分页
3. 投递状态变更历史
4. 技术栈档案与匹配度计算
5. 仪表盘统计接口
