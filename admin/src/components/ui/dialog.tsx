"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "@phosphor-icons/react";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Button } from "./button";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

type DialogContentProps = ComponentProps<typeof DialogPrimitive.Content> & {
  title: ReactNode;
  description?: ReactNode;
  /** Buttons row. */
  footer?: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
};

const SIZE: Record<NonNullable<DialogContentProps["size"]>, string> = {
  sm: "max-w-md",
  md: "max-w-xl",
  lg: "max-w-3xl",
  xl: "max-w-5xl",
};

/** A rounded panel over a dimmed ground. The one place a soft shadow is allowed. */
export function DialogContent({ title, description, footer, size = "md", className, children, ...props }: DialogContentProps) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="overlay-scrim fixed inset-0 z-50 bg-scrim" />
      <DialogPrimitive.Content
        className={cn(
          "dialog-panel fixed top-1/2 left-1/2 z-50 flex max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2 flex-col",
          "border border-hairline-strong bg-elevated text-ink shadow-sheet outline-none",
          SIZE[size],
          className,
        )}
        {...props}
      >
        <header className="flex items-start justify-between gap-4 border-b border-hairline px-5 py-4">
          <div className="min-w-0">
            <DialogPrimitive.Title className="font-heading text-base leading-6">{title}</DialogPrimitive.Title>
            {description ? (
              <DialogPrimitive.Description className="mt-1 text-xs leading-5 text-ink-soft">
                {description}
              </DialogPrimitive.Description>
            ) : null}
          </div>
          <DialogPrimitive.Close asChild>
            <Button variant="ghost" size="sm" icon aria-label="Close" className="-mr-1.5 -mt-1">
              <X size={16} aria-hidden="true" />
            </Button>
          </DialogPrimitive.Close>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer ? (
          <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-hairline px-5 py-3">
            {footer}
          </footer>
        ) : null}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}
