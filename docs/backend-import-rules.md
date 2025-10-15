# バックエンドアーキテクチャとimportルール

このドキュメントでは、バックエンドの4層アーキテクチャとimportルールについて説明します。

## 📐 アーキテクチャ概要

本プロジェクトは、4層のクリーンアーキテクチャを採用しています。

```
┌─────────────────────────────────────┐
│  Endpoint Layer (endpoint.trpc.ts)  │  ← 外部公開API
├─────────────────────────────────────┤
│  Service Layer (service.ts)         │  ← ビジネスロジック
├─────────────────────────────────────┤
│  Repository Layer (_repo.ts)        │  ← データアクセス
├─────────────────────────────────────┤
│  DTO Layer (_dto.ts)                │  ← データ変換
└─────────────────────────────────────┘
```

### レイヤーの責務

#### 1. Endpoint Layer (`endpoint.trpc.ts`)
- **役割**: tRPCエンドポイントの定義
- **責務**:
  - 認証チェック（`protectedProcedure`）
  - リクエスト/レスポンスの型定義
  - サービス層の呼び出し
  - エラー変換（`AppError` → `TRPCError`）
- **参照可能**:
  - ✅ `./service.ts`
  - ✅ `./contract.ts`
  - ✅ 共通モジュール (`@/server/types/*`, `@/server/utils/*`)
  - ❌ `./_repo.ts`（リポジトリ層への直接参照は禁止）

#### 2. Service Layer (`service.ts`)
- **役割**: ビジネスロジックの実装
- **責務**:
  - 入力検証（`.safeParse()`）
  - トランザクション管理
  - リポジトリ層の呼び出し
  - `Result<T, AppError>`パターンでのエラーハンドリング
- **参照可能**:
  - ✅ `../_repo.ts`（同一モジュール内）
  - ✅ `../_dto.ts`（同一モジュール内）
  - ✅ `./contract.ts`
  - ✅ 他モジュールの `index.ts`（`@/server/modules/*/index`）
  - ✅ 共通モジュール
  - ❌ 他モジュールの `_repo.ts`（直接参照は禁止）

#### 3. Repository Layer (`_repo.ts`)
- **役割**: データベースアクセス
- **責務**:
  - Drizzle ORMを使用したクエリ実行
  - トランザクション対応（`DBLike`型）
  - `Result<T, AppError>`を返す
- **参照可能**:
  - ✅ `./_dto.ts`
  - ✅ `@/server/db/schema/*`
  - ✅ 共通モジュール
  - ❌ `./service.ts`（上位層への逆参照は禁止）

#### 4. DTO Layer (`_dto.ts`)
- **役割**: データ変換ロジック
- **責務**:
  - Zodスキーマ定義
  - データベースモデルからDTOへの変換（`toDTO()`関数）
- **参照可能**:
  - ✅ `@/server/db/schema/*`
  - ✅ 共通モジュール

## 🔒 モジュール境界ルール

### プライベート（内部専用）ファイル

以下のファイルはアンダースコア(`_`)プレフィックスを持ち、**同一モジュール内からのみ**参照可能です。

- `_repo.ts` - リポジトリ層
- `_dto.ts` - DTO層

```typescript
// ❌ 禁止: 他モジュールからの直接参照
import { insertNote } from "@/server/modules/note/_repo";

// ✅ 推奨: index.ts経由での参照
import { createNote } from "@/server/modules/note";
```

### パブリック（外部公開）ファイル

以下のファイルは外部モジュールから参照可能です。

- `index.ts` - モジュールの公開API
- `endpoint.trpc.ts` - tRPCエンドポイント（APIルーターから参照）

### 共通モジュール（全レイヤーから参照可能）

以下のモジュールは、全てのレイヤーから自由に参照できます。

- `@/server/types/*` - 型定義
- `@/server/utils/*` - ユーティリティ関数
- `@/server/db/schema/*` - データベーススキーマ
- `@/server/api/trpc` - tRPC設定

## 📦 モジュール公開API (`index.ts`)

各ドメインモジュールには`index.ts`を配置し、外部向けの公開APIを定義します。

### なぜindex.tsが必要か？

1. **カプセル化**: 内部実装の詳細を隠蔽
2. **モジュール間の疎結合**: 直接依存を避ける
3. **変更容易性**: 内部実装の変更が外部に影響しにくい

### index.tsの実装例

```typescript
// src/server/modules/note/index.ts

import type { DBLike } from "@/server/db";
import type { NoteId, UserId } from "@/server/types/brand";
import type { AppError, AsyncResult } from "@/server/types/result";

import type { NoteDTO } from "./_dto";
import { findNotesByUserId, insertNote } from "./_repo";

// 型のエクスポート
export type { NoteDTO };

// 公開関数（リポジトリ層をラップ）
export const getNotesByUserId = (
  db: DBLike,
  userId: UserId,
  opts?: { limit?: number; offset?: number },
): AsyncResult<NoteDTO[], AppError> => {
  return findNotesByUserId(db, userId, opts);
};

export const createNote = (
  db: DBLike,
  values: { userId: UserId; title: string; content: string },
): AsyncResult<NoteDTO, AppError> => {
  return insertNote(db, values);
};
```

### 他モジュールからの利用例

```typescript
// src/server/modules/user/some-service.ts

import { getNotesByUserId } from "@/server/modules/note";

export const execute = async (deps: Deps, cmd: Request) => {
  // ✅ 正しい: index.ts経由で参照
  const notesResult = await getNotesByUserId(deps.db, cmd.userId);

  // 処理...
};
```

## 🚫 よくある違反パターンと修正方法

### 違反1: エンドポイント層からリポジトリ層を直接参照

```typescript
// ❌ 禁止
// endpoint.trpc.ts
import { insertNote } from "../_repo";

export const createNote = protectedProcedure
  .mutation(async ({ ctx, input }) => {
    const result = await insertNote(ctx.db, input);
    // ...
  });
```

**修正方法**: サービス層経由で参照

```typescript
// ✅ 正しい
// endpoint.trpc.ts
import { execute } from "./service";

export const createNote = protectedProcedure
  .mutation(async ({ ctx, input }) => {
    const deps = createAuthDeps(ctx.db, ctx.session.user.id);
    const result = await execute(deps, input);
    // ...
  });
```

### 違反2: 他モジュールのリポジトリ層を直接参照

```typescript
// ❌ 禁止
// src/server/modules/user/some-service.ts
import { findNotesByUserId } from "@/server/modules/note/_repo";

export const execute = async (deps: Deps, cmd: Request) => {
  const notesResult = await findNotesByUserId(deps.db, cmd.userId);
  // ...
};
```

**修正方法**: index.ts経由で参照

```typescript
// ✅ 正しい
// src/server/modules/user/some-service.ts
import { getNotesByUserId } from "@/server/modules/note";

export const execute = async (deps: Deps, cmd: Request) => {
  const notesResult = await getNotesByUserId(deps.db, cmd.userId);
  // ...
};
```

### 違反3: リポジトリ層からサービス層への逆参照

```typescript
// ❌ 禁止
// _repo.ts
import { someBusinessLogic } from "./service";

export const insertNote = async (db: DBLike, values) => {
  const result = someBusinessLogic(values); // 上位層への参照
  // ...
};
```

**修正方法**: ビジネスロジックはサービス層で実行

```typescript
// ✅ 正しい
// service.ts
export const execute = async (deps: Deps, cmd: Request) => {
  const processedData = someBusinessLogic(cmd); // サービス層で処理
  const result = await insertNote(deps.db, processedData);
  // ...
};
```

## 🛠️ ESLintルールによる強制

上記のルールは、ESLintで自動的にチェックされます。

```typescript
// eslint.config.ts
{
  "no-restricted-imports": [
    "warn",
    {
      patterns: [
        {
          group: ["**/modules/*/*/_repo", "**/modules/*/*/_repo.ts"],
          message: "リポジトリ層(_repo.ts)は同一モジュール内、または他モジュールのindex.ts経由でのみ参照可能です。"
        }
      ]
    }
  ]
}
```

### VSCodeでの自動チェック

`.vscode/settings.json`の設定により、ファイル保存時に自動でESLintが実行されます。

```json
{
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  }
}
```

## 📚 参考資料

- [CLAUDE.md](../CLAUDE.md) - プロジェクト全体のガイドライン
- [4層アーキテクチャ詳細](../CLAUDE.md#🏗️-アーキテクチャ)
- [Result型パターン](../CLAUDE.md#result型パターン)
- [エラーハンドリング](../CLAUDE.md#エラーハンドリング)

## 🤝 チーム開発での注意点

1. **新しいモジュールを作成する際**:
   - 必ず`index.ts`を作成し、外部公開APIを定義する
   - アンダースコアファイル（`_repo.ts`, `_dto.ts`）は内部専用として扱う

2. **他モジュールの機能を利用する際**:
   - 必ず`index.ts`経由で参照する
   - 直接`_repo.ts`や`_dto.ts`をimportしない

3. **ESLintの警告を無視しない**:
   - 警告が出た場合は、アーキテクチャルールに違反している可能性が高い
   - 適切な参照方法に修正する

4. **疑問があれば相談する**:
   - アーキテクチャルールに関する疑問があれば、チームで議論する
   - このドキュメントを随時更新する
