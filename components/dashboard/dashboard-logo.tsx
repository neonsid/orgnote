import { memo } from "react";
import Link from "next/link";
import Image from "next/image";

export const DashboardLogo = memo(function DashboardLogo() {
  return (
    <Link
      href="/dashboard"
      className="flex items-center gap-2 text-foreground hover:opacity-80 transition-opacity"
    >
      <div className="size-8 rounded-lg bg-linear-to-br from-blue-50 to-cyan-50 dark:from-blue-950/40 dark:to-cyan-950/30 border border-border flex items-center justify-center p-1">
        <Image
          src="/logo.svg"
          alt="Logo"
          width={24}
          height={24}
          className="size-5"
        />
      </div>
    </Link>
  );
});
