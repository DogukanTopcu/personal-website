import type { Metadata } from "next";
import { Wordmark } from "@/components/shell/wordmark";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

const NOTICES: Record<string, string> = {
  not_admin: "This account is not an admin.",
};

type SearchParams = Promise<{ next?: string | string[]; error?: string | string[] }>;

export default async function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const next = (Array.isArray(params.next) ? params.next[0] : params.next) ?? "/";
  const errorKey = Array.isArray(params.error) ? params.error[0] : params.error;
  const notice = errorKey ? (NOTICES[errorKey] ?? null) : null;

  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8">
          <Wordmark />
        </div>

        <div className="rounded-xl border border-hairline-strong bg-surface p-6">
          <h1 className="mb-1 text-lg leading-6">Sign in</h1>
          <p className="mb-6 text-[0.8125rem] text-ink-soft">Email and password. Sessions stay signed in on this device.</p>
          <LoginForm next={next} notice={notice} />
        </div>

        <p className="mt-5 text-xs leading-5 text-ink-soft">
          There is no sign-up. Accounts are created with the <code className="font-mono">create-admin</code> script
          from the repository root.
        </p>
      </div>
    </main>
  );
}
