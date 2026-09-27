"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { signIn, type LoginState } from "./actions";

const INITIAL: LoginState = { error: null, fieldErrors: {} };

type LoginFormProps = { next: string; notice: string | null };

export function LoginForm({ next, notice }: LoginFormProps) {
  const [state, action, pending] = useActionState(signIn, INITIAL);
  const error = state.error ?? notice;

  return (
    <form action={action} className="flex flex-col gap-5" noValidate>
      <input type="hidden" name="next" value={next} />

      <Field label="Email" error={state.fieldErrors.email}>
        <Input name="email" type="email" autoComplete="username" required autoFocus spellCheck={false} />
      </Field>

      <Field label="Password" error={state.fieldErrors.password}>
        <Input name="password" type="password" autoComplete="current-password" required />
      </Field>

      {error ? (
        <p role="alert" className="border-l-2 border-error pl-3 text-[0.8125rem] leading-5 text-error">
          {error}
        </p>
      ) : null}

      <Button type="submit" variant="primary" disabled={pending} className="mt-1">
        {pending ? "Signing in" : "Sign in"}
      </Button>
    </form>
  );
}
