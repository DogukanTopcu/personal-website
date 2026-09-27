import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

type InputProps = ComponentProps<"input"> & { mono?: boolean };

export function Input({ className, mono, ...props }: InputProps) {
  return <input className={cn("control", mono && "control-mono", className)} {...props} />;
}

type TextareaProps = ComponentProps<"textarea"> & { mono?: boolean };

export function Textarea({ className, mono, ...props }: TextareaProps) {
  return <textarea className={cn("control", mono && "control-mono", className)} {...props} />;
}

type SelectProps = ComponentProps<"select">;

export function Select({ className, ...props }: SelectProps) {
  return <select className={cn("control", className)} {...props} />;
}
