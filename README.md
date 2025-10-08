# T3 Stack テンプレート

## 概要

T3 Stack を使用したテンプレートプロジェクトです。
- Next.js
- TypeScript
- Tailwind CSS
- Drizzle ORM
- tRPC
- NextAuth.js
- Docker(PostgreSQL)

## 前提条件
- Docker
- Node.js
- pnpm

## 環境変数の設定

```bash
cp .env.example .env
```

`.env` ファイルを編集して環境変数を設定します。

## 初回セットアップ

```bash
pnpm init
```

※ `pnpm i && docker compose up -d && pnpm db:push` を一括で実行します。

## pnpmコマンド

```bash
# 依存関係のインストール
pnpm i

# 開発サーバーの起動
pnpm dev

# DBマイグレーションの適用
pnpm db:push

# Drizzle Studioの起動
pnpm db:studio
```

## Dockerコマンド

```bash
# 起動
docker compose up -d

# 状態確認
docker compose ps

# ログ確認
docker compose logs -f

# 停止
docker compose down

# ボリューム削除して停止
docker compose down -v
```

