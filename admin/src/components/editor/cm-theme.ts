import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { EditorView } from "@codemirror/view";
import { tags } from "@lezer/highlight";

/**
 * The editor reads the same CSS variables as the rest of the admin, so light
 * and dark need no separate theme objects.
 */
export const editorTheme = EditorView.theme({
  "&": {
    backgroundColor: "var(--elevated)",
    color: "var(--ink)",
  },
  ".cm-gutters": {
    backgroundColor: "var(--surface)",
    color: "var(--ink-soft)",
    borderRight: "1px solid var(--hairline)",
  },
  ".cm-matchingBracket": {
    outline: "1px solid var(--accent)",
    backgroundColor: "transparent",
  },
  ".cm-selectionMatch": {
    backgroundColor: "color-mix(in oklab, var(--accent) 14%, transparent)",
  },
  ".cm-searchMatch": {
    backgroundColor: "color-mix(in oklab, var(--warning) 30%, transparent)",
  },
  ".cm-searchMatch.cm-searchMatch-selected": {
    backgroundColor: "color-mix(in oklab, var(--warning) 55%, transparent)",
  },
  ".cm-foldPlaceholder": {
    backgroundColor: "var(--surface)",
    border: "1px solid var(--hairline-strong)",
    color: "var(--ink-soft)",
  },
});

const markdownHighlight = HighlightStyle.define([
  { tag: tags.heading, fontWeight: "600" },
  { tag: tags.heading1, fontWeight: "700" },
  { tag: tags.strong, fontWeight: "600" },
  { tag: tags.emphasis, fontStyle: "italic" },
  { tag: tags.strikethrough, textDecoration: "line-through", color: "var(--ink-soft)" },
  { tag: tags.link, color: "var(--accent)", textDecoration: "underline", textUnderlineOffset: "3px" },
  { tag: tags.url, color: "var(--ink-soft)" },
  { tag: tags.labelName, color: "var(--accent)" },
  { tag: tags.monospace, color: "var(--ink)", backgroundColor: "var(--surface)" },
  { tag: tags.quote, color: "var(--ink-soft)", fontStyle: "italic" },
  { tag: tags.list, color: "var(--accent)" },
  { tag: tags.atom, color: "var(--accent)" },
  { tag: tags.contentSeparator, color: "var(--ink-soft)" },
  { tag: tags.processingInstruction, color: "var(--ink-soft)" },
  { tag: tags.meta, color: "var(--ink-soft)" },
  { tag: tags.escape, color: "var(--warning)" },
  { tag: tags.string, color: "var(--success)" },
  // Nested code languages inside fences.
  { tag: tags.comment, color: "var(--ink-soft)", fontStyle: "italic" },
  { tag: tags.keyword, color: "var(--accent)" },
  { tag: tags.number, color: "var(--warning)" },
  { tag: tags.typeName, color: "var(--accent)" },
  { tag: tags.function(tags.variableName), color: "var(--ink)", fontWeight: "500" },
]);

export const editorHighlighting = syntaxHighlighting(markdownHighlight);
