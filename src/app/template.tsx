"use client";

import { PasswordGate } from "@/components/auth/password-gate";
import { Header } from "@/components/layout/header";

export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <PasswordGate>
      <Header />
      <main className="flex-1 mx-auto w-full max-w-6xl px-4 py-6">
        {children}
      </main>
    </PasswordGate>
  );
}
