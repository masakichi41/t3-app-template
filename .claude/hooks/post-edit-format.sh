#!/bin/bash

# Claude Code PostToolUse Hook: 自動フォーマット&検証
# WriteまたはEditツール使用後に実行されます

set -e

# プロジェクトディレクトリに移動
cd "${CLAUDE_PROJECT_DIR:-.}"

# 標準入力からJSONを読み取る
INPUT=$(cat)
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // "Unknown"')

# WriteまたはEdit操作でない場合は何もしない
if [[ "$TOOL_NAME" != "Write" ]] && [[ "$TOOL_NAME" != "Edit" ]] && [[ "$TOOL_NAME" != "NotebookEdit" ]]; then
  exit 0
fi

# 一時ファイルに出力を保存
TEMP_OUTPUT=$(mktemp)
trap "rm -f $TEMP_OUTPUT" EXIT

echo "[Claude Code Hook] コード品質チェックを実行中..." > "$TEMP_OUTPUT"
echo "" >> "$TEMP_OUTPUT"

# TypeScript型チェックを実行
echo "[1/3] TypeScriptの型チェック実行中..." >> "$TEMP_OUTPUT"
if pnpm typecheck >> "$TEMP_OUTPUT" 2>&1; then
  echo "[OK] TypeScript型チェック: 成功" >> "$TEMP_OUTPUT"
  TYPECHECK_OK=1
else
  echo "[ERROR] TypeScript型チェック: エラーが見つかりました" >> "$TEMP_OUTPUT"
  TYPECHECK_OK=0
fi
echo "" >> "$TEMP_OUTPUT"

# ESLint自動修正を実行
echo "[2/3] ESLint自動修正実行中..." >> "$TEMP_OUTPUT"
if pnpm lint:fix >> "$TEMP_OUTPUT" 2>&1; then
  echo "[OK] ESLint: 修正完了（またはエラーなし）" >> "$TEMP_OUTPUT"
  LINT_OK=1
else
  echo "[ERROR] ESLint: 自動修正できないエラーがあります" >> "$TEMP_OUTPUT"
  LINT_OK=0
fi
echo "" >> "$TEMP_OUTPUT"

# Prettierフォーマットを実行
echo "[3/3] Prettierフォーマット実行中..." >> "$TEMP_OUTPUT"
if pnpm format >> "$TEMP_OUTPUT" 2>&1; then
  echo "[OK] Prettier: フォーマット完了" >> "$TEMP_OUTPUT"
  FORMAT_OK=1
else
  echo "[ERROR] Prettier: フォーマット中にエラーが発生しました" >> "$TEMP_OUTPUT"
  FORMAT_OK=0
fi
echo "" >> "$TEMP_OUTPUT"

# 結果の集計
if [[ $TYPECHECK_OK -eq 1 ]] && [[ $LINT_OK -eq 1 ]] && [[ $FORMAT_OK -eq 1 ]]; then
  echo "[SUCCESS] すべてのチェックに合格しました" >> "$TEMP_OUTPUT"

  # 成功時のJSON出力
  cat "$TEMP_OUTPUT" | jq -Rs '{
    decision: "approve",
    reason: "コード品質チェック完了",
    systemMessage: .
  }'
  exit 0
else
  echo "[FAILED] 一部のチェックが失敗しました。上記のエラーを確認してください。" >> "$TEMP_OUTPUT"
  echo "" >> "$TEMP_OUTPUT"
  echo "[HINT] エラーを修正した後、再度編集を行うとこのフックが再実行されます。" >> "$TEMP_OUTPUT"

  # エラー時のJSON出力
  cat "$TEMP_OUTPUT" | jq -Rs '{
    decision: "block",
    reason: "コード品質チェックに失敗しました",
    systemMessage: .
  }'
  exit 2
fi
