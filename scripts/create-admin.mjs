#!/usr/bin/env node
/**
 * Creates (or promotes) the admin account for the admin panel.
 *
 *   node scripts/create-admin.mjs
 *
 * Reads SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from ./.env.local (or the
 * environment). Asks for the email and password interactively, so the password
 * never lands in your shell history.
 */
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { createInterface } from "node:readline";
import { Writable } from "node:stream";

dotenv.config({ path: new URL("../.env.local", import.meta.url).pathname, quiet: true });

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Put them in .env.local at the repo root.");
  process.exit(1);
}

function ask(question, { hidden = false } = {}) {
  return new Promise((resolve) => {
    let muted = false;
    const output = new Writable({
      write(chunk, encoding, callback) {
        if (!muted) process.stdout.write(chunk, encoding);
        callback();
      },
    });
    const rl = createInterface({ input: process.stdin, output, terminal: true });
    rl.question(question, (answer) => {
      rl.close();
      if (hidden) process.stdout.write("\n");
      resolve(answer.trim());
    });
    muted = hidden;
  });
}

const supabase = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

const email = (await ask("Admin email: ")).toLowerCase();
if (!/^\S+@\S+\.\S+$/.test(email)) {
  console.error("That does not look like an email address.");
  process.exit(1);
}

const { data: list, error: listError } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
if (listError) {
  console.error("Could not reach Supabase Auth:", listError.message);
  process.exit(1);
}

let user = list.users.find((u) => u.email?.toLowerCase() === email);

if (user) {
  console.log("An account with this email already exists. It will be granted admin access.");
} else {
  const password = await ask("Choose a password (min 10 characters): ", { hidden: true });
  if (password.length < 10) {
    console.error("Password too short.");
    process.exit(1);
  }
  const confirm = await ask("Repeat the password: ", { hidden: true });
  if (confirm !== password) {
    console.error("Passwords do not match.");
    process.exit(1);
  }
  const { data, error } = await supabase.auth.admin.createUser({ email, password, email_confirm: true });
  if (error) {
    console.error("Could not create the account:", error.message);
    process.exit(1);
  }
  user = data.user;
}

const { error: grantError } = await supabase.from("admins").upsert({ user_id: user.id });
if (grantError) {
  console.error("Account exists but could not be added to public.admins:", grantError.message);
  process.exit(1);
}

console.log(`Done. ${email} can now sign in to the admin panel.`);
