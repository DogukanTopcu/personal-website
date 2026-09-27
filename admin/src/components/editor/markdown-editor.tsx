"use client";

import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { languages } from "@codemirror/language-data";
import { EditorView, keymap, placeholder as cmPlaceholder } from "@codemirror/view";
import CodeMirror, { type ReactCodeMirrorRef } from "@uiw/react-codemirror";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { MediaPicker, type MediaPick } from "@/components/media/media-picker";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { countWords, formatDateTime, readingMinutes } from "@/lib/format";
import { useHydrated } from "@/lib/hooks";
import { markdownFor, uploadFile, UploadError } from "@/lib/media/upload";
import { editorHighlighting, editorTheme } from "./cm-theme";
import {
  insertAt,
  insertCodeBlock,
  insertLink,
  insertOwnLine,
  replaceToken,
  toggleBulletList,
  toggleHeading,
  toggleOrderedList,
  toggleQuote,
  toggleTaskList,
  wrapSelection,
} from "./commands";
import { FormattingHelp } from "./formatting-help";
import { clearLocalDraft, readLocalDraft, writeLocalDraft } from "./local-draft";
import { MarkdownPreview } from "./markdown-preview";
import { EditorToolbar } from "./toolbar";

type ViewMode = "write" | "split" | "preview";

type MarkdownEditorProps = {
  value: string;
  onChange: (value: string) => void;
  /** `table:id` for local autosave. Omit to disable autosave. */
  storageKey?: string;
  placeholder?: string;
  minHeight?: number;
  id?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean | "true" | "false";
};

const MODES: Array<{ value: ViewMode; label: string }> = [
  { value: "write", label: "Write" },
  { value: "split", label: "Split" },
  { value: "preview", label: "Preview" },
];

const AUTOSAVE_DELAY = 800;

function uploadToken(id: string) {
  return `uploading-${id}`;
}

/** Drops a placeholder per file at `pos`, uploads, then swaps in the markdown (or removes the placeholder). */
function uploadInto(view: EditorView, files: File[], pos: number | null) {
  let insertPos = pos ?? view.state.selection.main.from;

  for (const file of files) {
    const token = uploadToken(Math.random().toString(36).slice(2, 10));
    const placeholderText = `![Uploading ${file.name}](${token})`;
    insertPos = insertAt(view, insertPos, placeholderText).to;

    const promise = uploadFile(file).then((asset) => {
      replaceToken(view, placeholderText, markdownFor(asset));
      return asset;
    });

    toast.promise(promise, {
      loading: `Uploading ${file.name}`,
      success: `Uploaded ${file.name}`,
      error: (cause: unknown) => {
        replaceToken(view, placeholderText, "");
        return cause instanceof UploadError ? cause.message : `Could not upload ${file.name}.`;
      },
    });
  }
}

/**
 * CodeMirror 6 with the site's markdown dialect: toolbar, shortcuts, live
 * preview, file drops and pastes that upload to the library, and a local
 * autosave that survives a crash.
 */
export function MarkdownEditor({
  value,
  onChange,
  storageKey,
  placeholder = "Write in Markdown.",
  minHeight = 480,
  id,
  ...aria
}: MarkdownEditorProps) {
  const cmRef = useRef<ReactCodeMirrorRef>(null);
  const hydrated = useHydrated();
  const [mode, setMode] = useState<ViewMode>("write");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [initialValue] = useState(value);
  const [dismissed, setDismissed] = useState(false);

  function getView(): EditorView | null {
    return cmRef.current?.view ?? null;
  }

  /* ---------------------------------------------------- local autosave -- */

  // A draft left on this device is offered until the text is touched or the offer is dismissed.
  const stored = useMemo(() => (hydrated && storageKey ? readLocalDraft(storageKey) : null), [hydrated, storageKey]);
  const restorable = stored && !dismissed && value === initialValue && stored.value !== initialValue ? stored : null;

  useEffect(() => {
    if (!storageKey) return;
    const timer = setTimeout(() => {
      if (value === initialValue) clearLocalDraft(storageKey);
      else writeLocalDraft(storageKey, value);
    }, AUTOSAVE_DELAY);
    return () => clearTimeout(timer);
  }, [value, initialValue, storageKey]);

  function restore() {
    if (!restorable) return;
    onChange(restorable.value);
    setDismissed(true);
  }

  function discard() {
    if (storageKey) clearLocalDraft(storageKey);
    setDismissed(true);
  }

  /* ------------------------------------------------------- extensions -- */

  const extensions = useMemo(
    () => [
      markdown({ base: markdownLanguage, codeLanguages: languages, addKeymap: true }),
      EditorView.lineWrapping,
      editorTheme,
      editorHighlighting,
      cmPlaceholder(placeholder),
      keymap.of([
        { key: "Mod-b", run: (view) => wrapSelection(view, "**") },
        { key: "Mod-i", run: (view) => wrapSelection(view, "*") },
        { key: "Mod-Shift-x", run: (view) => wrapSelection(view, "~~") },
        { key: "Mod-k", run: insertLink },
        { key: "Mod-e", run: (view) => wrapSelection(view, "`", "`", "code") },
        { key: "Mod-Shift-k", run: (view) => insertCodeBlock(view) },
        { key: "Mod-Alt-2", run: (view) => toggleHeading(view, 2) },
        { key: "Mod-Alt-3", run: (view) => toggleHeading(view, 3) },
        { key: "Mod-Shift-7", run: toggleOrderedList },
        { key: "Mod-Shift-8", run: toggleBulletList },
        { key: "Mod-Shift-9", run: toggleTaskList },
        { key: "Mod-Shift-.", run: toggleQuote },
      ]),
      EditorView.domEventHandlers({
        drop(event, view) {
          const files = Array.from(event.dataTransfer?.files ?? []);
          if (files.length === 0) return false;
          event.preventDefault();
          uploadInto(view, files, view.posAtCoords({ x: event.clientX, y: event.clientY }));
          return true;
        },
        paste(event, view) {
          const files = Array.from(event.clipboardData?.files ?? []);
          if (files.length === 0) return false;
          event.preventDefault();
          uploadInto(view, files, null);
          return true;
        },
      }),
    ],
    [placeholder],
  );

  const basicSetup = useMemo(
    () => ({
      lineNumbers: false,
      foldGutter: false,
      highlightActiveLineGutter: false,
      highlightActiveLine: true,
      indentOnInput: false,
      autocompletion: false,
      closeBrackets: false,
      bracketMatching: true,
      allowMultipleSelections: true,
      tabSize: 2,
    }),
    [],
  );

  function onPick(picks: MediaPick[]) {
    const view = getView();
    if (!view || picks.length === 0) return;
    const lines = picks.map((pick) =>
      markdownFor({ ...pick.asset, alt: pick.alt || pick.asset.alt }, pick.caption),
    );
    insertOwnLine(view, lines.join("\n\n"));
  }

  const words = countWords(value);
  const minutes = readingMinutes(words);
  const showEditor = mode !== "preview";
  const showPreview = mode !== "write";

  return (
    <div
      className="flex flex-col overflow-hidden rounded-xl border border-hairline-strong bg-elevated focus-within:border-ink"
      aria-invalid={aria["aria-invalid"]}
      aria-describedby={aria["aria-describedby"]}
      id={id}
    >
      {restorable ? (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-hairline bg-surface px-3 py-2 text-xs" role="status">
          <span>
            An unsaved draft from {formatDateTime(restorable.savedAt)} was found on this device.
          </span>
          <span className="flex gap-2">
            <Button size="sm" variant="primary" onClick={restore}>
              Restore unsaved draft
            </Button>
            <Button size="sm" variant="ghost" onClick={discard}>
              Discard
            </Button>
          </span>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-hairline px-2 py-1">
        <div className="flex items-center" role="tablist" aria-label="View">
          {MODES.map((entry) => (
            <button
              key={entry.value}
              type="button"
              role="tab"
              aria-selected={mode === entry.value}
              onClick={() => setMode(entry.value)}
              className={cn(
                "h-7 border-b-2 border-transparent px-2.5 text-xs font-medium text-ink-soft outline-none hover:text-ink",
                "focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent",
                mode === entry.value && "border-ink text-ink",
              )}
            >
              {entry.label}
            </button>
          ))}
        </div>
        <FormattingHelp />
      </div>

      {showEditor ? <EditorToolbar getView={getView} onInsertMedia={() => setPickerOpen(true)} /> : null}

      <div className={cn("grid min-h-0", showEditor && showPreview ? "md:grid-cols-2" : "grid-cols-1")} style={{ minHeight }}>
        {showEditor ? (
          <div className={cn("cm-host min-h-0", showPreview && "md:border-r md:border-hairline")} style={{ minHeight }}>
            <CodeMirror
              ref={cmRef}
              value={value}
              onChange={onChange}
              extensions={extensions}
              basicSetup={basicSetup}
              theme="none"
              height="100%"
              minHeight={`${minHeight}px`}
              indentWithTab={false}
            />
          </div>
        ) : null}
        {showPreview ? (
          <div className="min-h-0 overflow-y-auto bg-surface px-6 py-5" style={{ maxHeight: mode === "split" ? "80vh" : undefined }}>
            <MarkdownPreview value={value} />
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-hairline px-3 py-1.5 font-mono text-[0.6875rem] text-ink-soft">
        <span>
          {words} word{words === 1 ? "" : "s"} · {minutes} min read
        </span>
        <span>Drop or paste files to upload them · Cmd/Ctrl+S saves</span>
      </div>

      <MediaPicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        mode="multiple"
        describe
        accept="image/*,video/*,audio/*"
        title="Insert media"
        onPick={onPick}
      />
    </div>
  );
}
