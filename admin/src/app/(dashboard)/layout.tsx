import type { ReactNode } from "react";
import { Sidebar } from "@/components/shell/sidebar";
import { TopBar } from "@/components/shell/top-bar";
import { requireAdmin } from "@/lib/auth";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  // Every page calls requireAdmin() as well; the lookup is shared per request.
  const { user } = await requireAdmin();

  return (
    <div className="min-h-dvh lg:pl-60">
      <Sidebar />
      <TopBar email={user.email} />
      <main className="mx-auto w-full max-w-[1200px] px-4 py-6 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
