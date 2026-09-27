"use client";

import { CheckSquare, Info, Warning, WarningOctagon } from "@phosphor-icons/react";
import { Toaster as SonnerToaster } from "sonner";

/** Transient confirmations only. Anything that needs a decision is a dialog. */
export function Toaster() {
  return (
    <SonnerToaster
      position="bottom-right"
      gap={8}
      offset={20}
      duration={3600}
      icons={{
        success: <CheckSquare size={16} aria-hidden="true" />,
        warning: <Warning size={16} aria-hidden="true" />,
        error: <WarningOctagon size={16} aria-hidden="true" />,
        info: <Info size={16} aria-hidden="true" />,
      }}
    />
  );
}
