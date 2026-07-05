import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import type { ReactNode } from "react";

export default function DiscoverLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#070711] text-white">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#070711]/80 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-bold text-slate-300 transition hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Nickhub
          </Link>
          <nav className="flex items-center gap-5 text-sm font-medium text-slate-300">
            <Link href="/discover" className="transition hover:text-white">Discover</Link>
            <Link href="/discover/trending" className="transition hover:text-white">Trending</Link>
            <Link href="/settings" className="transition hover:text-white">Settings</Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
