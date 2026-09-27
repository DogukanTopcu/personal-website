"use client";
// TEMPORARY verification route. Delete before hand-off.
import ErrorPage from "../../../error";

const failure = Object.assign(new Error("Proof"), { digest: "1234567890" });

export default function ErrorView() {
  return <ErrorPage error={failure} retry={() => undefined} />;
}
