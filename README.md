# OfferPath Backend

[![CI](https://github.com/hachiya-saku/offerpath-backend/actions/workflows/ci.yml/badge.svg)](https://github.com/hachiya-saku/offerpath-backend/actions/workflows/ci.yml)

[日本語](README.md) | [简体中文](README.zh-CN.md) | [English](README.en.md)

OfferPath Backend は、求職管理プラットフォーム OfferPath の REST API サーバーです。求人情報、応募ステータス、スキルプロフィール、マッチ度、認証などのデータを管理します。

フロントエンド: [offerpath-frontend](https://github.com/hachiya-saku/offerpath-frontend)

## 技術スタック

| 分類 | 技術 |
| --- | --- |
| ランタイム | Node.js 24 |
| フレームワーク | NestJS 11 |
| 言語 | TypeScript |
| データベース | PostgreSQL 18 |
| ORM | Prisma 7 |
| テスト | Jest / Supertest |
| パッケージ管理 | npm |

Prisma のマイグレーションとシードを使用して、PostgreSQL のスキーマと開発用データを管理します。

## 現在の状態

- NestJS プロジェクトの初期構成
- TypeScript strict モード
- API プレフィックス: `/api/v1`
- フロントエンド向け CORS 設定
- ヘルスチェック: `GET /api/v1/health`
- User / RefreshSession / Company / Job データモデルとマイグレーション
- Company CRUD API
- Job CRUD API
- メール登録、パスワードログイン、Access / Refresh Token ローテーション、マルチデバイスセッション
- JWT 認証、ユーザー単位のデータ分離、現在のデバイスのログアウト、プロフィール API
- 面接予定の登録・一覧取得と求人ステータスの連動更新
- 求人ステータスの修正・変更履歴と誤った面接進行の取り消し
- Unit / E2E テスト（Jest / Supertest）

## API

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/v1/health` | ヘルスチェック |
| `POST` | `/api/v1/auth/register` | ユーザー登録 |
| `POST` | `/api/v1/auth/login` | ログインして独立したデバイスセッションを作成 |
| `POST` | `/api/v1/auth/refresh` | 現在のセッションの Token ペアを更新 |
| `POST` | `/api/v1/auth/logout` | 現在のデバイスセッションからログアウト |
| `GET` | `/api/v1/users/me` | 現在のユーザープロフィールを取得 |
| `PATCH` | `/api/v1/users/me` | 現在のユーザープロフィールを更新 |
| `GET` | `/api/v1/companies` | 会社一覧 |
| `POST` | `/api/v1/companies` | 会社作成 |
| `PATCH` | `/api/v1/companies/:id` | 会社更新 |
| `DELETE` | `/api/v1/companies/:id` | 会社削除 |
| `POST` | `/api/v1/jobs` | 求人作成（会社を検索または自動作成） |
| `GET` | `/api/v1/jobs` | 求人一覧 |
| `GET` | `/api/v1/jobs/:id` | 求人詳細 |
| `PATCH` | `/api/v1/jobs/:id` | 求人更新 |
| `DELETE` | `/api/v1/jobs/:id` | 求人削除 |
| `POST` | `/api/v1/jobs/:id/interviews` | 次回面接を登録してステータスを更新 |
| `GET` | `/api/v1/interviews` | 面接予定一覧 |
| `PATCH` | `/api/v1/jobs/:id/status` | 求人ステータスを修正して理由を記録 |
| `GET` | `/api/v1/jobs/:id/status-history` | 求人ステータス履歴を取得 |
| `DELETE` | `/api/v1/jobs/:id/interviews/:interviewId/undo` | 直前の面接進行を取り消し |

業務 API は Access Token を必須とし、JWT の現在ユーザー単位でデータを分離します。ログインごとに独立した Refresh Session を作成するため、PC とスマートフォンで同時にログインでき、Token 更新とログアウトは現在のデバイスだけに影響します。

## セットアップ

```bash
npm install
```

`.env.example` を参考に `.env` を作成し、PostgreSQL の接続情報を設定します。

```env
PORT=3000
FRONTEND_URL=http://localhost:5173
DATABASE_URL=postgresql://postgres:password@localhost:5432/offerpath
JWT_ACCESS_SECRET=replace-with-a-long-random-secret
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_SECRET=replace-with-another-long-random-secret
JWT_REFRESH_EXPIRES_IN=7d
```

## 開発コマンド

```bash
npm run start:dev
npm run build
npm run lint
npm test
npm run test:e2e
```

開発サーバーはデフォルトで `http://localhost:3000` から起動します。

## 開発予定

1. 求人検索・絞り込み・ページネーション
2. 面接詳細・編集・削除
3. スキルプロフィールとマッチ度計算
4. ダッシュボード集計 API
5. 求人 URL の構造化解析

## リポジトリ構成

```text
src/
|- app.controller.ts       # ヘルスチェック
|- app.module.ts           # ルートモジュール
|- app.service.ts          # アプリケーションサービス
`- main.ts                 # 起動設定、CORS、API プレフィックス
test/                      # E2E テスト
```
