import { EditorSelection, type ChangeSpec, type SelectionRange } from "@codemirror/state";
import type { EditorView } from "@codemirror/view";

/**
 * Editing commands for the toolbar and the keymap. Every command returns
 * true so it can double as a CodeMirror keybinding.
 */

function refocus(view: EditorView) {
  view.focus();
  return true;
}

/** Wraps each selection in `before`/`after`; unwraps when already wrapped. */
export function wrapSelection(view: EditorView, before: string, after: string = before, placeholder = "text"): boolean {
  const changes = view.state.changeByRange((range) => {
    const doc = view.state.doc;
    const text = doc.sliceString(range.from, range.to);

    const outerBefore = doc.sliceString(Math.max(0, range.from - before.length), range.from);
    const outerAfter = doc.sliceString(range.to, Math.min(doc.length, range.to + after.length));
    if (outerBefore === before && outerAfter === after) {
      return {
        changes: [
          { from: range.from - before.length, to: range.from },
          { from: range.to, to: range.to + after.length },
        ],
        range: EditorSelection.range(range.from - before.length, range.to - before.length),
      };
    }

    if (text.startsWith(before) && text.endsWith(after) && text.length >= before.length + after.length) {
      const inner = text.slice(before.length, text.length - after.length);
      return {
        changes: { from: range.from, to: range.to, insert: inner },
        range: EditorSelection.range(range.from, range.from + inner.length),
      };
    }

    const inner = text || placeholder;
    return {
      changes: { from: range.from, to: range.to, insert: `${before}${inner}${after}` },
      range: EditorSelection.range(range.from + before.length, range.from + before.length + inner.length),
    };
  });
  view.dispatch(changes, { scrollIntoView: true });
  return refocus(view);
}

type LinePrefix = string | ((index: number) => string);

const HEADING = /^(#{1,6})\s+/;
const BULLET = /^(\s*)([-*+])\s+(\[[ xX]\]\s+)?/;
const ORDERED = /^(\s*)\d+[.)]\s+/;
const QUOTE = /^>\s?/;

function selectedLines(view: EditorView, range: SelectionRange) {
  const doc = view.state.doc;
  const first = doc.lineAt(range.from).number;
  const last = doc.lineAt(range.to).number;
  const lines = [];
  for (let n = first; n <= last; n++) lines.push(doc.line(n));
  return lines;
}

/** Adds or removes a line prefix on every selected line. */
export function toggleLinePrefix(view: EditorView, prefix: LinePrefix, matcher: RegExp): boolean {
  const range = view.state.selection.main;
  const lines = selectedLines(view, range);
  const allPrefixed = lines.every((line) => matcher.test(line.text) || line.text.trim() === "");
  const changes: ChangeSpec[] = [];

  lines.forEach((line, index) => {
    const match = line.text.match(matcher);
    if (allPrefixed) {
      if (match) changes.push({ from: line.from, to: line.from + match[0].length });
      return;
    }
    const text = typeof prefix === "function" ? prefix(index) : prefix;
    if (match) changes.push({ from: line.from, to: line.from + match[0].length, insert: text });
    else changes.push({ from: line.from, insert: text });
  });

  view.dispatch({ changes, scrollIntoView: true });
  return refocus(view);
}

export function toggleHeading(view: EditorView, level: 2 | 3): boolean {
  const mark = `${"#".repeat(level)} `;
  const range = view.state.selection.main;
  const lines = selectedLines(view, range);
  const changes: ChangeSpec[] = [];

  for (const line of lines) {
    const match = line.text.match(HEADING);
    if (match && match[1].length === level) {
      changes.push({ from: line.from, to: line.from + match[0].length });
    } else if (match) {
      changes.push({ from: line.from, to: line.from + match[0].length, insert: mark });
    } else {
      changes.push({ from: line.from, insert: mark });
    }
  }

  view.dispatch({ changes, scrollIntoView: true });
  return refocus(view);
}

export const toggleBulletList = (view: EditorView) => toggleLinePrefix(view, "- ", BULLET);
export const toggleTaskList = (view: EditorView) => toggleLinePrefix(view, "- [ ] ", BULLET);
export const toggleOrderedList = (view: EditorView) => toggleLinePrefix(view, (index) => `${index + 1}. `, ORDERED);
export const toggleQuote = (view: EditorView) => toggleLinePrefix(view, "> ", QUOTE);

/**
 * Inserts a block at the cursor on its own paragraph, with blank lines around
 * it. `select` picks a substring of `text` to leave selected.
 */
export function insertBlock(view: EditorView, text: string, select?: string): boolean {
  const state = view.state;
  const range = state.selection.main;
  const doc = state.doc;
  const line = doc.lineAt(range.from);

  const before = line.text.trim() === "" ? (line.number > 1 && doc.line(line.number - 1).text.trim() !== "" ? "\n" : "") : "\n\n";
  const after = "\n\n";
  const from = line.text.trim() === "" ? line.from : line.to;
  const to = line.text.trim() === "" ? line.to : line.to;

  const insert = `${before}${text}${after}`;
  const start = from + before.length;
  const index = select ? text.indexOf(select) : -1;
  const selection =
    index >= 0
      ? EditorSelection.range(start + index, start + index + (select?.length ?? 0))
      : EditorSelection.cursor(start + text.length);

  view.dispatch({ changes: { from, to, insert }, selection, scrollIntoView: true });
  return refocus(view);
}

export function insertLink(view: EditorView): boolean {
  const range = view.state.selection.main;
  const selected = view.state.doc.sliceString(range.from, range.to);
  if (selected) {
    const insert = `[${selected}](url)`;
    view.dispatch({
      changes: { from: range.from, to: range.to, insert },
      selection: EditorSelection.range(range.from + selected.length + 3, range.from + selected.length + 6),
      scrollIntoView: true,
    });
  } else {
    const insert = "[text](url)";
    view.dispatch({
      changes: { from: range.from, insert },
      selection: EditorSelection.range(range.from + 1, range.from + 5),
      scrollIntoView: true,
    });
  }
  return refocus(view);
}

export function insertCodeBlock(view: EditorView, language = "", title = ""): boolean {
  const range = view.state.selection.main;
  const selected = view.state.doc.sliceString(range.from, range.to);
  const meta = title ? ` title="${title.replace(/"/g, "")}"` : "";
  const body = selected || "code";
  return insertBlock(view, `\`\`\`${language}${meta}\n${body}\n\`\`\``, body);
}

export function insertTable(view: EditorView): boolean {
  const table = ["| Column | Column | Column |", "| --- | --- | --- |", "| cell | cell | cell |", "| cell | cell | cell |"].join("\n");
  return insertBlock(view, table, "Column");
}

export const insertRule = (view: EditorView) => insertBlock(view, "---");

export function insertCallout(view: EditorView, kind: "NOTE" | "TIP" | "IMPORTANT" | "WARNING" | "CAUTION"): boolean {
  const range = view.state.selection.main;
  const selected = view.state.doc.sliceString(range.from, range.to).trim();
  const body = selected ? selected.split("\n").map((line) => `> ${line}`).join("\n") : "> text";
  return insertBlock(view, `> [!${kind}]\n${body}`, selected ? undefined : "text");
}

export function insertDetails(view: EditorView): boolean {
  const range = view.state.selection.main;
  const selected = view.state.doc.sliceString(range.from, range.to).trim();
  return insertBlock(view, `:::details[Summary]\n${selected || "Hidden content"}\n:::`, "Summary");
}

export const insertInlineMath = (view: EditorView) => wrapSelection(view, "$", "$", "x^2");
export const insertBlockMath = (view: EditorView) => insertBlock(view, "$$\nE = mc^2\n$$", "E = mc^2");

/** Media and embeds go on their own line. */
export function insertOwnLine(view: EditorView, text: string): boolean {
  return insertBlock(view, text);
}

/** Inserts text at a document position on its own line. Returns the inserted text's range. */
export function insertAt(view: EditorView, pos: number, text: string): { from: number; to: number } {
  const doc = view.state.doc;
  const line = doc.lineAt(pos);
  const atLineStart = line.text.trim() === "";
  const before = atLineStart ? "" : "\n\n";
  const after = "\n";
  const from = atLineStart ? line.from : line.to;
  view.dispatch({ changes: { from, to: from, insert: `${before}${text}${after}` } });
  return { from: from + before.length, to: from + before.length + text.length };
}

/** Replaces the first occurrence of `token` in the document (used for upload placeholders). */
export function replaceToken(view: EditorView, token: string, replacement: string): boolean {
  const text = view.state.doc.toString();
  const index = text.indexOf(token);
  if (index < 0) return false;
  view.dispatch({ changes: { from: index, to: index + token.length, insert: replacement } });
  return true;
}
