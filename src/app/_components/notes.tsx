"use client";

import { useState } from "react";

import { api } from "@/trpc/react";

export const Notes = () => {
  const [notes] = api.note.list.useSuspenseQuery({ limit: 50, offset: 0 });

  const utils = api.useUtils();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  // 編集モード用の状態
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");

  const createNote = api.note.create.useMutation({
    onSuccess: async () => {
      await utils.note.invalidate();
      setTitle("");
      setContent("");
    },
  });

  const updateNote = api.note.update.useMutation({
    onSuccess: async () => {
      await utils.note.invalidate();
      setEditingNoteId(null);
      setEditTitle("");
      setEditContent("");
    },
  });

  const deleteNote = api.note.delete.useMutation({
    onSuccess: async () => {
      await utils.note.invalidate();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim() && content.trim()) {
      createNote.mutate({ title: title.trim(), content: content.trim() });
    }
  };

  const handleEditClick = (
    noteId: string,
    currentTitle: string,
    currentContent: string,
  ) => {
    setEditingNoteId(noteId);
    setEditTitle(currentTitle);
    setEditContent(currentContent);
  };

  const handleEditCancel = () => {
    setEditingNoteId(null);
    setEditTitle("");
    setEditContent("");
  };

  const handleEditSubmit = (noteId: string) => {
    if (editTitle.trim() && editContent.trim()) {
      updateNote.mutate({
        noteId,
        title: editTitle.trim(),
        content: editContent.trim(),
      });
    }
  };

  const handleDeleteClick = (noteId: string) => {
    if (window.confirm("このNoteを削除してもよろしいですか？")) {
      deleteNote.mutate({ noteId });
    }
  };

  return (
    <div className="w-full max-w-4xl space-y-8">
      {/* Note作成フォーム */}
      <div className="rounded-lg bg-white/10 p-6">
        <h2 className="mb-4 font-bold text-2xl">新しいNoteを作成</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              placeholder="タイトル"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg bg-white/10 px-4 py-2 text-white placeholder-white/50"
              maxLength={100}
            />
          </div>
          <div>
            <textarea
              placeholder="内容"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full rounded-lg bg-white/10 px-4 py-2 text-white placeholder-white/50"
              rows={4}
              maxLength={10000}
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-lg bg-white/10 px-6 py-3 font-semibold transition hover:bg-white/20 disabled:opacity-50"
            disabled={createNote.isPending || !title.trim() || !content.trim()}
          >
            {createNote.isPending ? "作成中..." : "作成"}
          </button>
        </form>
      </div>

      {/* Note一覧 */}
      <div className="space-y-4">
        <h2 className="font-bold text-2xl">Noteリスト</h2>
        {notes.notes.length === 0 ? (
          <div className="rounded-lg bg-white/5 p-8 text-center text-white/60">
            まだNoteがありません。上のフォームから作成してください。
          </div>
        ) : (
          <div className="space-y-4">
            {notes.notes.map((note) => {
              const isEditing = editingNoteId === note.id;

              return (
                <div
                  key={note.id}
                  className="rounded-lg bg-white/10 p-6 transition hover:bg-white/15"
                >
                  {isEditing ? (
                    // 編集モード
                    <div className="space-y-4">
                      <div>
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="w-full rounded-lg bg-white/10 px-4 py-2 text-white placeholder-white/50"
                          maxLength={100}
                          placeholder="タイトル"
                        />
                      </div>
                      <div>
                        <textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="w-full rounded-lg bg-white/10 px-4 py-2 text-white placeholder-white/50"
                          rows={4}
                          maxLength={10000}
                          placeholder="内容"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleEditSubmit(note.id)}
                          className="rounded-lg bg-white/10 px-4 py-2 font-semibold transition hover:bg-white/20 disabled:opacity-50"
                          disabled={
                            updateNote.isPending ||
                            !editTitle.trim() ||
                            !editContent.trim()
                          }
                        >
                          {updateNote.isPending ? "保存中..." : "保存"}
                        </button>
                        <button
                          type="button"
                          onClick={handleEditCancel}
                          className="rounded-lg bg-white/5 px-4 py-2 font-semibold transition hover:bg-white/10"
                          disabled={updateNote.isPending}
                        >
                          キャンセル
                        </button>
                      </div>
                    </div>
                  ) : (
                    // 表示モード
                    <>
                      <div className="mb-2 flex items-start justify-between">
                        <h3 className="font-bold text-xl">{note.title}</h3>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              handleEditClick(note.id, note.title, note.content)
                            }
                            className="rounded-lg bg-white/10 px-3 py-1 text-sm font-semibold transition hover:bg-white/20"
                          >
                            編集
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteClick(note.id)}
                            className="rounded-lg bg-red-500/20 px-3 py-1 text-sm font-semibold text-red-200 transition hover:bg-red-500/30"
                            disabled={deleteNote.isPending}
                          >
                            削除
                          </button>
                        </div>
                      </div>
                      <p className="mb-4 whitespace-pre-wrap text-white/80">
                        {note.content}
                      </p>
                      <div className="text-white/40 text-sm">
                        作成日時:{" "}
                        {new Date(note.createdAt).toLocaleString("ja-JP")}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
