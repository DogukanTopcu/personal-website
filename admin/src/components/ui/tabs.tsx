"use client";

import * as TabsPrimitive from "@radix-ui/react-tabs";
import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

export const Tabs = TabsPrimitive.Root;

export function TabsList({ className, ...props }: ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      className={cn("flex flex-wrap items-end gap-1 border-b border-hairline-strong", className)}
      {...props}
    />
  );
}

type TriggerProps = ComponentProps<typeof TabsPrimitive.Trigger> & {
  /** A small square marker, for "this tab has errors". */
  marker?: "error" | "warning";
};

export function TabsTrigger({ className, children, marker, ...props }: TriggerProps) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        "-mb-px flex h-9 items-center gap-2 border-b-2 border-transparent px-3 text-[0.8125rem] font-medium text-ink-soft outline-none",
        "hover:text-ink data-[state=active]:border-ink data-[state=active]:text-ink",
        "focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent",
        className,
      )}
      {...props}
    >
      {children}
      {marker ? (
        <span
          className={cn("block h-1.5 w-1.5 rounded-full", marker === "error" ? "bg-error" : "bg-warning")}
          aria-label={marker === "error" ? "Has errors" : "Needs attention"}
        />
      ) : null}
    </TabsPrimitive.Trigger>
  );
}

export function TabsContent({ className, ...props }: ComponentProps<typeof TabsPrimitive.Content>) {
  return <TabsPrimitive.Content className={cn("pt-5 outline-none", className)} {...props} />;
}
