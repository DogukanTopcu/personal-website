"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="dashed-frame mx-auto mt-12 max-w-lg px-6 py-10 text-center">
      <p className="eyebrow mb-2">Something went wrong</p>
      <h1 className="text-lg">This page could not be drawn.</h1>
      <p className="mt-2 text-[0.8125rem] text-ink-soft">{error.message || "An unexpected error happened."}</p>
      <div className="mt-5 flex justify-center">
        <Button variant="primary" onClick={reset}>
          Try again
        </Button>
      </div>
    </div>
  );
}
