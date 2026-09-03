# OfferPath Backend

[![CI](https://github.com/hachiya-saku/offerpath-backend/actions/workflows/ci.yml/badge.svg)](https://github.com/hachiya-saku/offerpath-backend/actions/workflows/ci.yml)

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
- User / RefreshSession / Company / Job 数据模型与迁移
- Company CRUD 接口
- Job 完整 CRUD 接口
- 邮箱注册、密码登录、Access / Refresh Token 轮换与多设备会话
- JWT 鉴权、用户数据隔离、当前设备退出与个人资料接口
- 面试安排创建、列表查询与岗位状态联动更新
- 岗位状态修正、变更历史与错误面试推进撤销
- Jest 单元测试与 Supertest E2E 测试

## API

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `GET` | `/api/v1/health` | 健康检查 |
| `POST` | `/api/v1/auth/register` | 用户注册 |
| `POST` | `/api/v1/auth/login` | 登录并创建独立设备会话 |
| `POST` | `/api/v1/auth/refresh` | 轮换当前会话的 Token 对 |
| `POST` | `/api/v1/auth/logout` | 退出当前设备会话 |
| `GET` | `/api/v1/users/me` | 获取当前用户资料 |
| `PATCH` | `/api/v1/users/me` | 修改当前用户资料 |
| `GET` | `/api/v1/companies` | 公司列表 |
| `POST` | `/api/v1/companies` | 创建公司 |
| `PATCH` | `/api/v1/companies/:id` | 更新公司 |
| `DELETE` | `/api/v1/companies/:id` | 删除公司 |
| `POST` | `/api/v1/jobs` | 创建岗位（查找或自动创建公司） |
| `GET` | `/api/v1/jobs` | 岗位列表 |
| `GET` | `/api/v1/jobs/:id` | 岗位详情 |
| `PATCH` | `/api/v1/jobs/:id` | 更新岗位 |
| `DELETE` | `/api/v1/jobs/:id` | 删除岗位 |
| `POST` | `/api/v1/jobs/:id/interviews` | 安排下一轮面试并更新岗位状态 |
| `GET` | `/api/v1/interviews` | 面试安排列表 |
| `PATCH` | `/api/v1/jobs/:id/status` | 修正岗位状态并记录原因 |
| `GET` | `/api/v1/jobs/:id/status-history` | 查询岗位状态历史 |
| `DELETE` | `/api/v1/jobs/:id/interviews/:interviewId/undo` | 撤销最近一次面试推进 |

除注册、登录、Token 刷新和健康检查外，业务接口均使用 Access Token 鉴权，并按 JWT 当前用户隔离数据。每次登录创建独立的 Refresh Session，因此电脑与手机可以同时登录；刷新和退出只影响当前设备。

## 本地运行

```bash
npm install
```

参考 `.env.example` 创建 `.env`，填写本机 PostgreSQL 连接信息：

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

默认服务地址为 `http://localhost:3000`。

## 常用命令

```bash
npm run build
npm run lint
npm test
npm run test:e2e
```

## 后续开发顺序

1. 岗位搜索、筛选与分页
2. 面试详情、编辑与删除
3. 技术栈档案与匹配度计算
4. 仪表盘统计接口
5. 岗位 URL 结构化解析
