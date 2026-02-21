"use client";

import { Header } from "@/components/header";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container px-4 py-6">
        {/* Page content */}
      </main>
    </div>
  );
}
