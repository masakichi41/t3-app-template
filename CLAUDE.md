# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Guidelines for Claude Code

- **All file writes must use UTF-8 encoding with LF (Unix-style) line endings, not Shift-JIS**.
- You must **think exclusively in English**. However, you must need to **respond in Japanese**.
- To maximize efficiency, if you need to execute multiple independent processes, invoke those tools concurrently, not sequentially.

## プロジェクト概要

T3 Stack を使用したフルスタックテンプレートプロジェクト。Next.js、TypeScript、Drizzle ORM、tRPC、NextAuth.jsを使用。

## よく使うコマンド

### 開発

```bash
# 初回セットアップ（依存関係インストール + Docker起動 + DB初期化）
pnpm init

# 開発サーバー起動
pnpm dev

# 開発サーバーとDrizzle Studioを同時起動
pnpm dev:all
```

### データベース

```bash
# DBマイグレーション適用
pnpm db:push

# Drizzle Studio起動（DBのGUI管理ツール）
pnpm db:studio

# マイグレーションファイル生成
pnpm db:generate
```

### コード品質

```bash
# Biomeでコードチェック
pnpm check

# Biomeで自動修正
pnpm check:write

# Biomeで自動修正（unsafeな修正も含む）
pnpm check:unsafe

# 型チェック
pnpm typecheck
```

### Docker

```bash
# PostgreSQL起動
docker compose up -d

# PostgreSQL停止（データは保持）
docker compose down

# PostgreSQL停止（データも削除）
docker compose down -v
```

## バックエンドアーキテクチャ

### 4層レイヤードアーキテクチャ

バックエンドは以下の4層構造を採用：

1. **Endpoint層** (`endpoint.trpc.ts`)
   - tRPCエンドポイントの定義
   - 認証チェック（`protectedProcedure` / `公開Procedure`）
   - contextからユーザー情報を取得してServiceに渡す
   - Result型のエラーをTRPCErrorに変換

2. **Service層** (`service.ts`)
   - ビジネスロジックの実装
   - 入力バリデーション（Zodによる検証）
   - `Result<T, AppError>` 型によるエラーハンドリング
   - Repositoryを呼び出してデータアクセス

3. **Repository層** (`_repo.ts`)
   - データベースアクセスロジック
   - Drizzle ORMを使用したCRUD操作
   - `DBLike` 型を受け取ることでトランザクション対応
   - すべてのDB操作は `Result<T, AppError>` を返す

4. **DTO層** (`_dto.ts`)
   - データ変換ロジック
   - Zodスキーマによる型定義
   - `toDTO()` 関数でDBモデルからDTOへ変換

### モジュール構造

各機能は `src/server/modules/{domain}/{action}/` の形式で構成：

```
src/server/modules/
└── note/                    # ドメイン
    ├── _dto.ts             # DTO定義（ドメイン共通）
    ├── _repo.ts            # リポジトリ（ドメイン共通）
    └── create/             # アクション
        ├── contract.ts     # 入出力スキーマ定義
        ├── service.ts      # ビジネスロジック
        └── endpoint.trpc.ts # tRPCエンドポイント
```

#### contract.ts の設計

contract.ts では以下の4つのスキーマを定義：

- `request`: tRPCエンドポイントのリクエストスキーマ（クライアントから受け取る）
- `response`: tRPCエンドポイントのレスポンススキーマ（クライアントに返す）
- `input`: サービス層の入力スキーマ（内部的に厳密な検証）
- `output`: サービス層の出力スキーマ（内部処理用）

この分離により、外部APIと内部ロジックの責務を明確に分けている。

### エラーハンドリング

#### Result型パターン

GoライクなResult型を使用し、エラーを値として扱う：

```typescript
type Result<T, E> = Ok<T> | Err<E>
type AsyncResult<T, E = Error> = Promise<Result<T, E>>
```

使用例：
```typescript
const result = await someOperation()
if (!result.success) {
  return Err(result.error)
}
return Ok(result.data)
```

#### AppError型

統一的なエラー構造：

```typescript
type AppError = {
  kind: ErrorKind  // "validation" | "not_found" | "conflict" | "auth" など
  code: string     // 機械判定用コード
  message?: string // 内部向けメッセージ
  safeMessage?: string // 外部向けメッセージ
  details?: unknown // ZodIssue[] など詳細情報
  cause?: unknown  // 元のエラー
}
```

エラーファクトリを使用：
```typescript
Errors.validation("INVALID_INPUT", zodError.issues)
Errors.notFound()
Errors.infraDb("DB_ERROR", error)
```

### 型安全性

#### Brand型

型安全性を高めるためのブランド型を使用（`src/server/types/brand.ts`）：

```typescript
type Brand<T, B> = T & { __brand: B }
type UserId = Brand<string, "UserId">
type NoteId = Brand<string, "NoteId">
```

これにより、単純な文字列の混同を防ぐ。

#### DBLike型

トランザクション対応のためのデータベース型抽象化：

```typescript
type DBLike = typeof db | Parameters<Parameters<typeof db.transaction>[0]>[0]
```

リポジトリ関数はすべて `DBLike` を受け取ることで、通常のDB操作とトランザクション内操作の両方に対応。

### tRPC設定

- **Transformer**: SuperJSON（Date、Map、Setなどをシリアライズ）
- **Error Formatter**: ZodErrorを自動的にフラット化
- **Timing Middleware**: 開発環境で100-500msの人工的遅延を追加（ウォーターフォール検出用）
- **認証Middleware**: `protectedProcedure` でセッション検証

### データベース

#### Drizzle ORM

- **スキーマ定義**: `src/server/db/schema/` 以下にテーブルごとに定義
- **テーブルプレフィックス**: すべてのテーブルに `template_` プレフィックス（マルチプロジェクトスキーマ対応）
- **型推論**: `InsertNote`、`SelectNote` など、Drizzleの型推論を活用

#### マイグレーション

- `pnpm db:push`: スキーマ変更を直接DBに反映（開発時）
- `pnpm db:generate`: マイグレーションファイル生成
- `pnpm db:migrate`: マイグレーション実行

### コーディングルール

#### function宣言禁止

`rules/no-function-declaration.grit` により、すべての関数はアロー関数で定義すること：

```typescript
// ❌ NG
function foo() {}
export function bar() {}

// ✅ OK
const foo = () => {}
export const bar = () => {}
```

#### コードスタイル

- **リンター/フォーマッター**: Biome v2を使用
- **インポート順**: `@/` エイリアスを使用した絶対パス
- **型定義**: 明示的な型注釈を推奨（特にパブリックAPI）

### tRPCルーター登録

新しいエンドポイントを追加する場合は `src/server/api/root.ts` にルーターを登録：

```typescript
export const appRouter = createTRPCRouter({
  post: postRouter,
  // 新しいルーターをここに追加
})
```

### 環境変数

- `.env.example` をコピーして `.env` を作成
- 環境変数スキーマは `/src/env.js` で定義（`@t3-oss/env-nextjs` を使用）
- **重要**: `.env` ファイルは直接編集せず、`.env.example` を参照すること

## 新機能の追加手順

1. データベーススキーマを定義（`src/server/db/schema/`）
2. `pnpm db:push` でスキーマをDBに反映
3. モジュール構造を作成（`src/server/modules/{domain}/{action}/`）
4. 以下のファイルを順に実装：
   - `_dto.ts`: DTO定義
   - `_repo.ts`: リポジトリ
   - `contract.ts`: 入出力スキーマ
   - `service.ts`: ビジネスロジック
   - `endpoint.trpc.ts`: tRPCエンドポイント
5. `src/server/api/root.ts` にルーターを登録
6. 型チェック（`pnpm typecheck`）とコードチェック（`pnpm check`）を実行
