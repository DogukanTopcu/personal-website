"use client";

import * as AlertDialog from "@radix-ui/react-alert-dialog";
import type { ReactNode } from "react";
import { buttonClass } from "./button";

type ConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Destructive confirms are drawn in the error colour, only here. */
  destructive?: boolean;
  pending?: boolean;
  onConfirm: () => void;
};

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  pending = false,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <AlertDialog.Root open={open} onOpenChange={pending ? undefined : onOpenChange}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="overlay-scrim fixed inset-0 z-[60] bg-scrim" />
        <AlertDialog.Content className="dialog-panel fixed top-1/2 left-1/2 z-[60] w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 border border-hairline-strong bg-elevated p-5 text-ink shadow-sheet outline-none">
          <AlertDialog.Title className="font-heading text-base leading-6">{title}</AlertDialog.Title>
          {description ? (
            <AlertDialog.Description className="mt-2 text-[0.8125rem] leading-5 text-ink-soft">
              {description}
            </AlertDialog.Description>
          ) : null}
          <div className="mt-5 flex justify-end gap-2">
            <AlertDialog.Cancel className={buttonClass({ variant: "secondary" })} disabled={pending}>
              {cancelLabel}
            </AlertDialog.Cancel>
            <AlertDialog.Action
              className={buttonClass({ variant: destructive ? "danger" : "primary" })}
              disabled={pending}
              onClick={(event) => {
                event.preventDefault();
                onConfirm();
              }}
            >
              {pending ? "Working" : confirmLabel}
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
