"use client";

import { X } from "@phosphor-icons/react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { CoverField } from "@/components/content/cover-field";
import { FileField } from "@/components/content/file-field";
import { SortableList } from "@/components/content/sortable-list";
import { clearLocalDraft } from "@/components/editor/local-draft";
import { MarkdownEditor } from "@/components/editor/markdown-editor";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input, Textarea } from "@/components/ui/input";
import { TagInput } from "@/components/ui/tag-input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Time } from "@/components/ui/time";
import type { FieldErrors } from "@/lib/action-result";
import { saveSettings } from "@/lib/actions/settings";
import { useSaveShortcut, useUnsavedGuard } from "@/lib/hooks";
import type { SettingsInput } from "@/lib/schemas";

type Props = { initial: SettingsInput; updatedAt: string };

type Tab = "profile" | "bio" | "now" | "socials" | "seo";

const TABS: Array<{ value: Tab; label: string; prefixes: string[] }> = [
  { value: "profile", label: "Profile", prefixes: ["full_name", "headline", "intro", "location", "email", "avatar_url", "avatar_alt", "resume_url"] },
  { value: "bio", label: "Bio", prefixes: ["bio_md"] },
  { value: "now", label: "Now", prefixes: ["now_md"] },
  { value: "socials", label: "Socials and skills", prefixes: ["socials", "skills", "interests"] },
  { value: "seo", label: "SEO", prefixes: ["site_title", "site_description", "site_url", "og_image_url"] },
];

const BIO_KEY = "site_settings:bio_md";
const NOW_KEY = "site_settings:now_md";

type Keyed<T> = T & { key: string };

function withKeys<T>(list: T[]): Keyed<T>[] {
  return list.map((entry, index) => ({ ...entry, key: `k${index}` }));
}

function stripKeys<T>(list: Keyed<T>[]): T[] {
  return list.map(({ key: _key, ...rest }) => rest as T);
}

export function SettingsForm({ initial, updatedAt }: Props) {
  const [values, setValues] = useState(initial);
  const [socials, setSocials] = useState(() => withKeys(initial.socials));
  const [skills, setSkills] = useState(() => withKeys(initial.skills));
  const [snapshot, setSnapshot] = useState(() => JSON.stringify(initial));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<Tab>("profile");
  const [savedAt, setSavedAt] = useState(updatedAt);

  const current: SettingsInput = { ...values, socials: stripKeys(socials), skills: stripKeys(skills) };
  const dirty = JSON.stringify(current) !== snapshot;

  const set = (patch: Partial<SettingsInput>) => setValues((state) => ({ ...state, ...patch }));
  const error = (key: string) => errors[key] ?? null;

  const submit = useCallback(async () => {
    if (saving) return;
    setSaving(true);
    setFormError(null);
    const input: SettingsInput = { ...values, socials: stripKeys(socials), skills: stripKeys(skills) };
    try {
      const result = await saveSettings(input);
      if (!result.ok) {
        setErrors(result.fieldErrors ?? {});
        setFormError(result.error);
        const first = Object.keys(result.fieldErrors ?? {})[0];
        const owner = TABS.find((entry) => entry.prefixes.some((prefix) => first?.startsWith(prefix)));
        if (owner) setTab(owner.value);
        return;
      }
      setErrors({});
      setSnapshot(JSON.stringify(input));
      setSavedAt(result.data.updated_at);
      clearLocalDraft(BIO_KEY);
      clearLocalDraft(NOW_KEY);
      if (result.warning) toast.warning(result.warning);
      else toast.success("Settings saved.");
    } catch {
      setFormError("The save did not go through. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }, [saving, values, socials, skills]);

  useUnsavedGuard(dirty && !saving);
  useSaveShortcut(useCallback(() => void submit(), [submit]));

  const tabMarker = (entry: (typeof TABS)[number]) =>
    Object.keys(errors).some((key) => entry.prefixes.some((prefix) => key.startsWith(prefix))) ? "error" : undefined;

  function setSocial(index: number, patch: Partial<SettingsInput["socials"][number]>) {
    setSocials((list) => list.map((entry, i) => (i === index ? { ...entry, ...patch } : entry)));
  }

  function setSkill(index: number, patch: Partial<SettingsInput["skills"][number]>) {
    setSkills((list) => list.map((entry, i) => (i === index ? { ...entry, ...patch } : entry)));
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="sticky top-14 z-20 -mx-4 flex flex-wrap items-center justify-between gap-3 border-b border-hairline-strong bg-paper px-4 py-3 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <p className="font-mono text-[0.6875rem] text-ink-soft" aria-live="polite">
          {dirty ? "Unsaved changes" : "All changes saved"}
          {savedAt ? (
            <>
              {" · last saved "}
              <Time iso={savedAt} mode="relative" />
            </>
          ) : null}
        </p>
        <div className="flex items-center gap-3">
          {formError ? (
            <p role="alert" className="text-xs text-error">
              {formError}
            </p>
          ) : null}
          <Button variant="primary" disabled={saving} onClick={() => void submit()}>
            {saving ? "Saving" : "Save settings"}
          </Button>
        </div>
      </div>

      <Tabs value={tab} onValueChange={(value) => setTab(value as Tab)}>
        <TabsList>
          {TABS.map((entry) => (
            <TabsTrigger key={entry.value} value={entry.value} marker={tabMarker(entry)}>
              {entry.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="profile">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
            <div className="flex flex-col gap-4">
              <Field label="Full name" helper="The home page greets people with the first word, as in: Hi, I'm Doğukan." error={error("full_name")}>
                <Input value={values.full_name} onChange={(event) => set({ full_name: event.target.value })} />
              </Field>
              <Field label="Headline" helper="One line. Under your name on the about page, and in the footer." error={error("headline")}>
                <Input value={values.headline} onChange={(event) => set({ headline: event.target.value })} />
              </Field>
              <Field label="Intro" helper="The paragraph under the greeting on the home page." error={error("intro")}>
                <Textarea value={values.intro} onChange={(event) => set({ intro: event.target.value })} rows={4} />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Location" helper="Based in, on the home page and in the footer." error={error("location")}>
                  <Input value={values.location} onChange={(event) => set({ location: event.target.value })} />
                </Field>
                <Field label="Email" helper="Where Get in touch goes. Empty sends people to LinkedIn." error={error("email")}>
                  <Input type="email" mono value={values.email} onChange={(event) => set({ email: event.target.value })} />
                </Field>
              </div>
              <FileField
                label="Resume"
                value={values.resume_url}
                onChange={(resume_url) => set({ resume_url })}
                error={error("resume_url")}
                helper="A PDF from the library."
                fieldKey="resume_url"
              />
            </div>
            <div>
              <CoverField
                label="Avatar"
                helper="A square photo. Shown on the home page and the about page; your initials stand in until there is one."
                url={values.avatar_url}
                alt={values.avatar_alt}
                onChange={({ url, alt }) => set({ avatar_url: url, avatar_alt: alt })}
                urlError={error("avatar_url")}
                altError={error("avatar_alt")}
                fieldKeys={{ url: "avatar_url", alt: "avatar_alt" }}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="bio">
          <Field label="Bio" as="group" helper="The about page. Markdown, same dialect as posts." error={error("bio_md")}>
            <MarkdownEditor value={values.bio_md} onChange={(bio_md) => set({ bio_md })} storageKey={BIO_KEY} />
          </Field>
        </TabsContent>

        <TabsContent value="now">
          <Field label="Now" as="group" helper="What you are up to at the moment." error={error("now_md")}>
            <MarkdownEditor value={values.now_md} onChange={(now_md) => set({ now_md })} storageKey={NOW_KEY} minHeight={320} />
          </Field>
        </TabsContent>

        <TabsContent value="socials">
          <div className="flex flex-col gap-8">
            <Field label="Social links" as="group" helper="In order. Drag to reorder." error={error("socials")}>
              <div className="flex flex-col gap-2">
                {socials.length > 0 ? (
                  <SortableList
                    items={socials}
                    getId={(entry) => entry.key}
                    onReorder={setSocials}
                    className="flex flex-col gap-2"
                    renderItem={(entry, handle, index) => (
                      <div className="flex items-start gap-2 rounded-lg border border-hairline-strong bg-surface p-2">
                        <button {...handle} />
                        <div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-3">
                          <Field label="Label" error={error(`socials.${index}.label`)}>
                            <Input value={entry.label} onChange={(event) => setSocial(index, { label: event.target.value })} placeholder="GitHub" />
                          </Field>
                          <Field label="URL" error={error(`socials.${index}.url`)}>
                            <Input mono value={entry.url} onChange={(event) => setSocial(index, { url: event.target.value })} placeholder="https://" />
                          </Field>
                          <Field label="Handle" error={error(`socials.${index}.handle`)}>
                            <Input mono value={entry.handle} onChange={(event) => setSocial(index, { handle: event.target.value })} placeholder="@handle" />
                          </Field>
                        </div>
                        <Button variant="ghost" icon aria-label="Remove link" onClick={() => setSocials((list) => list.filter((_, i) => i !== index))}>
                          <X size={14} aria-hidden="true" />
                        </Button>
                      </div>
                    )}
                  />
                ) : null}
                <div>
                  <Button size="sm" onClick={() => setSocials((list) => [...list, { key: `k${Date.now()}`, label: "", url: "", handle: "" }])}>
                    Add link
                  </Button>
                </div>
              </div>
            </Field>

            <Field label="Skills" as="group" helper="Groups of skills, in order. Drag to reorder groups." error={error("skills")}>
              <div className="flex flex-col gap-2">
                {skills.length > 0 ? (
                  <SortableList
                    items={skills}
                    getId={(entry) => entry.key}
                    onReorder={setSkills}
                    className="flex flex-col gap-2"
                    renderItem={(entry, handle, index) => (
                      <div className="flex items-start gap-2 rounded-lg border border-hairline-strong bg-surface p-2">
                        <button {...handle} />
                        <div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-[12rem_minmax(0,1fr)]">
                          <Field label="Group" error={error(`skills.${index}.group`)}>
                            <Input value={entry.group} onChange={(event) => setSkill(index, { group: event.target.value })} placeholder="Languages" />
                          </Field>
                          <Field label="Items" error={error(`skills.${index}.items`)}>
                            <TagInput value={entry.items} onChange={(items) => setSkill(index, { items })} placeholder="TypeScript, C#, ..." />
                          </Field>
                        </div>
                        <Button variant="ghost" icon aria-label="Remove group" onClick={() => setSkills((list) => list.filter((_, i) => i !== index))}>
                          <X size={14} aria-hidden="true" />
                        </Button>
                      </div>
                    )}
                  />
                ) : null}
                <div>
                  <Button size="sm" onClick={() => setSkills((list) => [...list, { key: `k${Date.now()}`, group: "", items: [] }])}>
                    Add group
                  </Button>
                </div>
              </div>
            </Field>

            <Field label="Interests" helper="Enter or comma adds one." error={error("interests")}>
              <TagInput value={values.interests} onChange={(interests) => set({ interests })} placeholder="Drawing, cinema, ..." />
            </Field>
          </div>
        </TabsContent>

        <TabsContent value="seo">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
            <div className="flex flex-col gap-4">
              <Field label="Site title" error={error("site_title")}>
                <Input value={values.site_title} onChange={(event) => set({ site_title: event.target.value })} />
              </Field>
              <Field label="Site description" helper="Used for search results and link previews." error={error("site_description")} aside={`${values.site_description.length} / 600`}>
                <Textarea value={values.site_description} onChange={(event) => set({ site_description: event.target.value })} rows={3} />
              </Field>
              <Field label="Site URL" helper="The canonical origin, such as https://dogukantopcu.com" error={error("site_url")}>
                <Input type="url" mono value={values.site_url} onChange={(event) => set({ site_url: event.target.value })} />
              </Field>
            </div>
            <div>
              <CoverField
                label="Default share image"
                url={values.og_image_url}
                alt=""
                withAlt={false}
                onChange={({ url }) => set({ og_image_url: url })}
                urlError={error("og_image_url")}
                helper="1200 by 630 works best."
                fieldKeys={{ url: "og_image_url", alt: "og_image_alt" }}
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
