import Link from "next/link";

import { Notes } from "@/app/_components/notes";
import { auth } from "@/server/auth";
import { api, HydrateClient } from "@/trpc/server";

export default async function Home() {
  const session = await auth();

  if (session?.user) {
    void api.note.list.prefetch({ limit: 50, offset: 0 });
  }

  return (
    <HydrateClient>
      <main className="flex min-h-screen flex-col items-center bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white">
        {/* ヘッダー */}
        <div className="w-full border-b border-white/10 bg-white/5">
          <div className="container mx-auto flex items-center justify-between px-4 py-4">
            <h1 className="font-bold text-2xl">Note App</h1>
            {session?.user && (
              <div className="flex items-center gap-4">
                <span className="text-white/80">
                  {session.user.name || session.user.email}
                </span>
                <Link
                  href="/api/auth/signout"
                  className="rounded-lg bg-white/10 px-4 py-2 font-semibold transition hover:bg-white/20"
                >
                  ログアウト
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* メインコンテンツ */}
        <div className="container flex flex-col items-center px-4 py-12">
          {session?.user ? (
            <Notes />
          ) : (
            <div className="flex flex-col items-center gap-8 py-16">
              <h2 className="font-bold text-4xl">ようこそ！</h2>
              <p className="text-center text-white/80 text-xl">
                Noteアプリを使用するにはログインしてください
              </p>
              <Link
                href="/api/auth/signin"
                className="rounded-lg bg-white/10 px-8 py-4 font-semibold text-lg transition hover:bg-white/20"
              >
                ログイン
              </Link>
            </div>
          )}
        </div>
      </main>
    </HydrateClient>
  );
}
