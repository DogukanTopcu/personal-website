"use client";

import * as Menu from "@radix-ui/react-dropdown-menu";
import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

export const DropdownMenu = Menu.Root;
export const DropdownMenuTrigger = Menu.Trigger;
export const DropdownMenuGroup = Menu.Group;

type ContentProps = ComponentProps<typeof Menu.Content>;

export function DropdownMenuContent({ className, align = "end", sideOffset = 4, ...props }: ContentProps) {
  return (
    <Menu.Portal>
      <Menu.Content
        align={align}
        sideOffset={sideOffset}
        collisionPadding={12}
        className={cn(
          "popover-panel z-50 min-w-44 border border-hairline-strong bg-elevated py-1 text-ink shadow-sheet outline-none",
          className,
        )}
        {...props}
      />
    </Menu.Portal>
  );
}

type ItemProps = ComponentProps<typeof Menu.Item>;

export function DropdownMenuItem({ className, ...props }: ItemProps) {
  return (
    <Menu.Item
      className={cn(
        "flex h-8 cursor-pointer select-none items-center gap-2.5 px-3 text-[0.8125rem] outline-none",
        "data-[highlighted]:bg-surface data-[disabled]:cursor-not-allowed data-[disabled]:opacity-45",
        className,
      )}
      {...props}
    />
  );
}

export function DropdownMenuLabel({ className, ...props }: ComponentProps<typeof Menu.Label>) {
  return <Menu.Label className={cn("eyebrow px-3 pt-1.5 pb-1", className)} {...props} />;
}

export function DropdownMenuSeparator({ className, ...props }: ComponentProps<typeof Menu.Separator>) {
  return <Menu.Separator className={cn("my-1 h-px bg-hairline", className)} {...props} />;
}

export function DropdownMenuRadioGroup(props: ComponentProps<typeof Menu.RadioGroup>) {
  return <Menu.RadioGroup {...props} />;
}

export function DropdownMenuRadioItem({ className, children, ...props }: ComponentProps<typeof Menu.RadioItem>) {
  return (
    <Menu.RadioItem
      className={cn(
        "flex h-8 cursor-pointer select-none items-center gap-2.5 px-3 text-[0.8125rem] outline-none",
        "data-[highlighted]:bg-surface",
        className,
      )}
      {...props}
    >
      <span className="flex h-3 w-3 items-center justify-center border border-ink" aria-hidden="true">
        <Menu.ItemIndicator>
          <span className="block h-1.5 w-1.5 bg-ink" />
        </Menu.ItemIndicator>
      </span>
      {children}
    </Menu.RadioItem>
  );
}
