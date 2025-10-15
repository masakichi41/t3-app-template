import { FlatCompat } from "@eslint/eslintrc";
// @ts-expect-error -- no types for this plugin
import drizzle from "eslint-plugin-drizzle";
import importPlugin from "eslint-plugin-import";
import importXPlugin from "eslint-plugin-import-x";
import tseslint from "typescript-eslint";

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
});

const config = [
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "dist/**",
      "build/**",
      "next-env.d.ts",
      "src/components/ui/**",
    ],
  },
  ...compat.extends("next/core-web-vitals"),
  ...tseslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    files: ["**/*.ts", "**/*.tsx"],
    plugins: {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      drizzle,
    },
    rules: {
      "@typescript-eslint/array-type": "off",
      "@typescript-eslint/consistent-type-definitions": "off",
      "@typescript-eslint/consistent-type-imports": [
        "warn",
        { prefer: "type-imports", fixStyle: "inline-type-imports" },
      ],
      "@typescript-eslint/consistent-type-exports": [
        "warn",
        { fixMixedExportsWithInlineTypeSpecifier: true },
      ],
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/require-await": "off",
      "@typescript-eslint/no-misused-promises": [
        "error",
        { checksVoidReturn: { attributes: false } },
      ],
      "@typescript-eslint/no-floating-promises": [
        "error",
        { ignoreVoid: true, ignoreIIFE: true },
      ],
      "@typescript-eslint/no-unused-expressions": [
        "warn",
        { allowShortCircuit: true, allowTernary: true },
      ],
      // console系メソッドの制限（デフォルトで全て禁止）
      "no-console": "error",
      // セキュリティ: eval系の使用禁止
      "no-eval": "error",
      "no-implied-eval": "error",
      "@typescript-eslint/no-implied-eval": "error",
      // function宣言の禁止（アロー関数に統一）
      "no-restricted-syntax": [
        "error",
        {
          selector: "FunctionDeclaration",
          message:
            "関数宣言ではなくアロー関数を使用してください。例: export const foo = () => {}",
        },
        {
          selector: "FunctionExpression",
          message:
            "関数式ではなくアロー関数を使用してください。例: const foo = () => {}",
        },
      ],
      "drizzle/enforce-delete-with-where": [
        "error",
        { drizzleObjectName: ["db", "ctx.db"] },
      ],
      "drizzle/enforce-update-with-where": [
        "error",
        { drizzleObjectName: ["db", "ctx.db"] },
      ],
    },
  },
  {
    linterOptions: {
      reportUnusedDisableDirectives: true,
    },
    languageOptions: {
      parserOptions: {
        projectService: true,
      },
    },
  },
  {
    plugins: {
      import: importPlugin,
    },
    rules: {
      "import/order": [
        "error",
        {
          groups: [
            "builtin",
            "external",
            "internal",
            ["parent", "sibling"],
            "object",
            "type",
            "index",
          ],
          "newlines-between": "always",
          pathGroupsExcludedImportTypes: ["builtin"],
          alphabetize: { order: "asc", caseInsensitive: true },
          pathGroups: [
            {
              pattern: "@/**",
              group: "internal",
              position: "before",
            },
            {
              pattern: "./**.css",
              group: "index",
              position: "after",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/server/**/*.ts"],
    plugins: {
      "import-x": importXPlugin,
    },
    rules: {
      "no-restricted-imports": [
        "warn",
        {
          patterns: [
            {
              group: ["**/modules/*/*/_repo", "**/modules/*/*/_repo.ts"],
              message:
                "リポジトリ層(_repo.ts)は同一モジュール内、または他モジュールのindex.ts経由でのみ参照可能です。",
            },
            {
              group: ["**/modules/*/*/_dto", "**/modules/*/*/_dto.ts"],
              message: "DTO層(_dto.ts)は同一モジュール内からのみ参照可能です。",
            },
            {
              group: ["**/modules/*/*/service", "**/modules/*/*/service.ts"],
              message:
                "サービス層(service.ts)は同一モジュール内からのみ参照可能です。",
            },
            {
              group: ["**/modules/*/*/contract", "**/modules/*/*/contract.ts"],
              message:
                "Contract層(contract.ts)は同一モジュール内からのみ参照可能です。",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/server/modules/*/*/endpoint.trpc.ts"],
    rules: {
      "no-restricted-imports": [
        "warn",
        {
          patterns: [
            {
              group: ["**/_repo", "**/_repo.ts", "../_repo", "../_repo.ts"],
              message:
                "エンドポイント層からリポジトリ層を直接参照することはできません。サービス層経由で参照してください。",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/server/modules/**/_repo.ts", "src/server/modules/**/service.ts"],
    rules: {
      "@typescript-eslint/only-throw-error": [
        "error",
        { allowThrowingAny: false, allowThrowingUnknown: false },
      ],
    },
  },
  {
    files: ["src/server/**/*.ts"],
    rules: {
      // console.logなどは全て禁止（trpc.tsは例外設定で許可）
      "no-console": "error",
      // console.warn/console.errorは警告レベル
      "no-restricted-syntax": [
        "warn",
        {
          selector:
            "CallExpression[callee.object.name='console'][callee.property.name=/^(warn|error)$/]",
          message:
            "console.warn/console.errorの使用は非推奨です。将来的には専用のログシステムに移行してください。",
        },
      ],
    },
  },
  {
    files: ["src/server/api/trpc.ts"],
    rules: {
      "no-console": [
        "warn",
        {
          allow: ["log"], // 開発用ミドルウェアなのでconsole.logのみ許可
        },
      ],
    },
  },
];

export default config;
