"use client";

import type { EditorView } from "@codemirror/view";
import {
  ArrowsOutLineHorizontal,
  Code,
  CodeBlock,
  Function,
  Image as ImageIcon,
  Link as LinkIcon,
  ListBullets,
  ListChecks,
  ListNumbers,
  Minus,
  Quotes,
  Sigma,
  TextB,
  TextHOne,
  TextHTwo,
  TextItalic,
  TextStrikethrough,
  Table,
  Warning,
  YoutubeLogo,
  type Icon,
} from "@phosphor-icons/react";
import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip } from "@/components/ui/tooltip";
import { useHydrated } from "@/lib/hooks";
import { parseEmbedUrl } from "@/lib/markdown/plugins";
import {
  insertBlockMath,
  insertCallout,
  insertCodeBlock,
  insertDetails,
  insertInlineMath,
  insertLink,
  insertOwnLine,
  insertRule,
  insertTable,
  toggleBulletList,
  toggleHeading,
  toggleOrderedList,
  toggleQuote,
  toggleTaskList,
  wrapSelection,
} from "./commands";

type ToolbarProps = {
  getView: () => EditorView | null;
  onInsertMedia: () => void;
};

type Tool = {
  label: string;
  shortcut?: string;
  icon: Icon;
  run: (view: EditorView) => void;
};

const TEXT_TOOLS: Tool[] = [
  { label: "Bold", shortcut: "Mod+B", icon: TextB, run: (view) => wrapSelection(view, "**") },
  { label: "Italic", shortcut: "Mod+I", icon: TextItalic, run: (view) => wrapSelection(view, "*") },
  { label: "Strikethrough", shortcut: "Mod+Shift+X", icon: TextStrikethrough, run: (view) => wrapSelection(view, "~~") },
  { label: "Heading 2", shortcut: "Mod+Alt+2", icon: TextHOne, run: (view) => toggleHeading(view, 2) },
  { label: "Heading 3", shortcut: "Mod+Alt+3", icon: TextHTwo, run: (view) => toggleHeading(view, 3) },
  { label: "Link", shortcut: "Mod+K", icon: LinkIcon, run: insertLink },
  { label: "Inline code", shortcut: "Mod+E", icon: Code, run: (view) => wrapSelection(view, "`", "`", "code") },
];

const BLOCK_TOOLS: Tool[] = [
  { label: "Quote", shortcut: "Mod+Shift+.", icon: Quotes, run: toggleQuote },
  { label: "Bullet list", shortcut: "Mod+Shift+8", icon: ListBullets, run: toggleBulletList },
  { label: "Numbered list", shortcut: "Mod+Shift+7", icon: ListNumbers, run: toggleOrderedList },
  { label: "Task list", shortcut: "Mod+Shift+9", icon: ListChecks, run: toggleTaskList },
  { label: "Table", icon: Table, run: insertTable },
  { label: "Horizontal rule", icon: Minus, run: insertRule },
];

const MATH_TOOLS: Tool[] = [
  { label: "Inline math", icon: Function, run: insertInlineMath },
  { label: "Block math", icon: Sigma, run: insertBlockMath },
];

const CALLOUTS = ["NOTE", "TIP", "IMPORTANT", "WARNING", "CAUTION"] as const;

const COMMON_LANGUAGES = ["ts", "tsx", "js", "jsx", "json", "bash", "python", "sql", "css", "html", "yaml", "rust", "go", "c", "cpp", "csharp", "java", "kotlin", "swift", "markdown", "diff"];

function ToolButton({ tool, getView, isMac }: { tool: Tool; getView: () => EditorView | null; isMac: boolean }) {
  const shortcut = tool.shortcut?.replace("Mod", isMac ? "Cmd" : "Ctrl").replace("Alt", isMac ? "Option" : "Alt");
  const Icon = tool.icon;
  return (
    <Tooltip label={shortcut ? `${tool.label} (${shortcut})` : tool.label}>
      <Button
        variant="ghost"
        size="sm"
        icon
        aria-label={tool.label}
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => {
          const view = getView();
          if (view) tool.run(view);
        }}
      >
        <Icon size={16} aria-hidden="true" />
      </Button>
    </Tooltip>
  );
}

function Divider() {
  return <span className="mx-0.5 h-5 w-px shrink-0 bg-hairline-strong" aria-hidden="true" />;
}

function ToolGroup({ children }: { children: ReactNode }) {
  return <div className="flex items-center">{children}</div>;
}

export function EditorToolbar({ getView, onInsertMedia }: ToolbarProps) {
  const hydrated = useHydrated();
  const isMac = hydrated && /Mac|iPhone|iPad/.test(navigator.platform);

  return (
    <div className="flex flex-wrap items-center gap-y-1 border-b border-hairline bg-surface px-1.5 py-1" role="toolbar" aria-label="Formatting">
      <ToolGroup>
        {TEXT_TOOLS.map((tool) => (
          <ToolButton key={tool.label} tool={tool} getView={getView} isMac={isMac} />
        ))}
        <CodeBlockPopover getView={getView} />
      </ToolGroup>
      <Divider />
      <ToolGroup>
        {BLOCK_TOOLS.map((tool) => (
          <ToolButton key={tool.label} tool={tool} getView={getView} isMac={isMac} />
        ))}
      </ToolGroup>
      <Divider />
      <ToolGroup>
        <CalloutMenu getView={getView} />
        <Tooltip label="Details block">
          <Button variant="ghost" size="sm" icon aria-label="Details block" onMouseDown={(event) => event.preventDefault()} onClick={() => {
            const view = getView();
            if (view) insertDetails(view);
          }}>
            <ArrowsOutLineHorizontal size={16} aria-hidden="true" />
          </Button>
        </Tooltip>
        {MATH_TOOLS.map((tool) => (
          <ToolButton key={tool.label} tool={tool} getView={getView} isMac={isMac} />
        ))}
      </ToolGroup>
      <Divider />
      <ToolGroup>
        <Tooltip label="Insert media from the library">
          <Button variant="ghost" size="sm" icon aria-label="Insert media" onMouseDown={(event) => event.preventDefault()} onClick={onInsertMedia}>
            <ImageIcon size={16} aria-hidden="true" />
          </Button>
        </Tooltip>
        <EmbedPopover getView={getView} />
      </ToolGroup>
    </div>
  );
}

function CalloutMenu({ getView }: { getView: () => EditorView | null }) {
  return (
    <DropdownMenu>
      <Tooltip label="Callout">
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" icon aria-label="Callout">
            <Warning size={16} aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
      </Tooltip>
      <DropdownMenuContent align="start">
        {CALLOUTS.map((kind) => (
          <DropdownMenuItem
            key={kind}
            onSelect={() => {
              const view = getView();
              if (view) insertCallout(view, kind);
            }}
          >
            {kind.charAt(0) + kind.slice(1).toLowerCase()}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function CodeBlockPopover({ getView }: { getView: () => EditorView | null }) {
  const [open, setOpen] = useState(false);
  const [language, setLanguage] = useState("");
  const [title, setTitle] = useState("");

  function insert() {
    const view = getView();
    if (view) insertCodeBlock(view, language.trim(), title.trim());
    setOpen(false);
    setLanguage("");
    setTitle("");
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Tooltip label="Code block">
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" icon aria-label="Code block">
            <CodeBlock size={16} aria-hidden="true" />
          </Button>
        </PopoverTrigger>
      </Tooltip>
      <PopoverContent className="w-72">
        <form
          className="flex flex-col gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            insert();
          }}
        >
          <Field label="Language" helper="For syntax highlighting, such as ts or python.">
            <Input value={language} onChange={(event) => setLanguage(event.target.value)} list="code-languages" autoFocus mono />
          </Field>
          <datalist id="code-languages">
            {COMMON_LANGUAGES.map((entry) => (
              <option key={entry} value={entry} />
            ))}
          </datalist>
          <Field label="Title" helper="Optional file name shown above the block.">
            <Input value={title} onChange={(event) => setTitle(event.target.value)} mono />
          </Field>
          <div className="flex justify-end">
            <Button type="submit" variant="primary" size="sm">
              Insert code block
            </Button>
          </div>
        </form>
      </PopoverContent>
    </Popover>
  );
}

function EmbedPopover({ getView }: { getView: () => EditorView | null }) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);

  function insert() {
    const target = parseEmbedUrl(url.trim());
    if (!target) {
      setError("Paste a YouTube or Vimeo video link.");
      return;
    }
    const view = getView();
    if (view) insertOwnLine(view, url.trim());
    setOpen(false);
    setUrl("");
    setError(null);
  }

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setError(null);
      }}
    >
      <Tooltip label="Insert YouTube or Vimeo video">
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" icon aria-label="Insert YouTube or Vimeo video">
            <YoutubeLogo size={16} aria-hidden="true" />
          </Button>
        </PopoverTrigger>
      </Tooltip>
      <PopoverContent className="w-80">
        <form
          className="flex flex-col gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            insert();
          }}
        >
          <Field label="Video link" helper="The link goes on its own line and becomes a player on the site." error={error}>
            <Input value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://youtu.be/..." autoFocus mono />
          </Field>
          <div className="flex justify-end">
            <Button type="submit" variant="primary" size="sm">
              Insert video
            </Button>
          </div>
        </form>
      </PopoverContent>
    </Popover>
  );
}
