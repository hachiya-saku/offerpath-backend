# OfferPath Backend

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
| テスト | Jest / Supertest |
| パッケージ管理 | npm |

ORM はデータモデル設計時に選定します。現時点では TypeORM や Prisma を導入していません。

## 現在の状態

- NestJS プロジェクトの初期構成
- TypeScript strict モード
- API プレフィックス: `/api/v1`
- フロントエンド向け CORS 設定
- ヘルスチェック: `GET /api/v1/health`
- 環境変数テンプレート
- Unit / E2E テスト

## セットアップ

```bash
npm install
```

`.env.example` を参考に `.env` を作成し、PostgreSQL の接続情報を設定します。

```env
PORT=3000
FRONTEND_URL=http://localhost:5173
DATABASE_URL=postgresql://postgres:password@localhost:5432/offerpath
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

1. データモデルと ORM の選定
2. PostgreSQL 接続とマイグレーション
3. ユーザー認証と Token 管理
4. 求人 CRUD とステータス履歴
5. スキルプロフィールとマッチ度計算
6. ダッシュボード集計 API

## リポジトリ構成

```text
src/
|- app.controller.ts       # ヘルスチェック
|- app.module.ts           # ルートモジュール
|- app.service.ts          # アプリケーションサービス
`- main.ts                 # 起動設定、CORS、API プレフィックス
test/                      # E2E テスト
```
