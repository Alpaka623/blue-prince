"use client";

import { SessionGate } from "@/components/auth/session-gate";
import { SessionProvider } from "@/components/auth/session-context";
import { Header } from "@/components/layout/header";

export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <SessionGate>
        <Header />
        <main className="flex-1 mx-auto w-full max-w-6xl px-4 py-6">
          {children}
        </main>
      </SessionGate>
    </SessionProvider>
  );
}
