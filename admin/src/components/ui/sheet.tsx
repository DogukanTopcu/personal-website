"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "@phosphor-icons/react";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Button } from "./button";

export const Sheet = DialogPrimitive.Root;
export const SheetTrigger = DialogPrimitive.Trigger;
export const SheetClose = DialogPrimitive.Close;

type SheetContentProps = ComponentProps<typeof DialogPrimitive.Content> & {
  title: ReactNode;
  description?: ReactNode;
  footer?: ReactNode;
  side?: "left" | "right";
  /** Hide the visual header while keeping the title for assistive tech. */
  hideHeader?: boolean;
};

/** A panel sliding in from the side. Forms and the phone navigation live here. */
export function SheetContent({
  title,
  description,
  footer,
  side = "right",
  hideHeader = false,
  className,
  children,
  ...props
}: SheetContentProps) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="overlay-scrim fixed inset-0 z-50 bg-scrim" />
      <DialogPrimitive.Content
        data-side={side}
        className={cn(
          "sheet-panel fixed inset-y-0 z-50 flex h-dvh w-[min(30rem,100vw)] flex-col bg-elevated text-ink shadow-sheet outline-none",
          side === "right" ? "right-0 border-l border-hairline-strong" : "left-0 border-r border-hairline-strong",
          className,
        )}
        {...props}
      >
        {hideHeader ? (
          <>
            <DialogPrimitive.Title className="sr-only">{title}</DialogPrimitive.Title>
            {description ? <DialogPrimitive.Description className="sr-only">{description}</DialogPrimitive.Description> : null}
          </>
        ) : (
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
        )}
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
