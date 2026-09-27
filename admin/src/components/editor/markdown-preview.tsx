"use client";

import { memo, type ComponentProps, type ReactNode } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import type { PluggableList } from "unified";
import rehypeHighlight from "rehype-highlight";
import rehypeKatex from "rehype-katex";
import remarkDirective from "remark-directive";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import { cn } from "@/lib/cn";
import { remarkAlerts, remarkDetails, remarkDirectiveFallback, remarkMedia } from "@/lib/markdown/plugins";
import "katex/dist/katex.min.css";

/** Same pipeline and order as the public site. */
const REMARK_PLUGINS: PluggableList = [
  remarkGfm,
  remarkMath,
  remarkDirective,
  remarkAlerts,
  remarkDetails,
  remarkDirectiveFallback,
  remarkMedia,
];
const REHYPE_PLUGINS: PluggableList = [rehypeKatex, [rehypeHighlight, { detect: false }]];

/** The label the public site prints above each kind of callout. */
const CALLOUT: Record<string, string> = {
  note: "Note",
  tip: "Tip",
  important: "Important",
  warning: "Warning",
  caution: "Caution",
};

type DataProps = Record<`data-${string}`, string | undefined>;

/** `title="file.ts"` from a fence's meta string. */
function codeTitle(meta: unknown): string | null {
  if (typeof meta !== "string") return null;
  const match = meta.match(/title=(?:"([^"]*)"|'([^']*)'|(\S+))/);
  return match ? (match[1] ?? match[2] ?? match[3] ?? null) : null;
}

const components: Components = {
  a({ href, children, ...props }) {
    const external = typeof href === "string" && /^https?:\/\//.test(href);
    return (
      <a href={href} {...props} target={external ? "_blank" : undefined} rel={external ? "noopener" : undefined}>
        {children}
      </a>
    );
  },
  img({ src, alt, ...props }) {
    const url = typeof src === "string" ? src : undefined;
    // eslint-disable-next-line @next/next/no-img-element -- content images can live anywhere
    return <img src={url} alt={alt ?? ""} loading="lazy" decoding="async" {...props} />;
  },
  aside({ node: _node, children, className, ...rest }) {
    const data = rest as DataProps;
    const kind = data["data-callout"];
    const label = kind ? CALLOUT[kind] : undefined;
    if (!label) {
      return (
        <aside className={className} {...rest}>
          {children}
        </aside>
      );
    }
    return (
      <aside data-callout={kind} className={className}>
        <p className="md-callout-label">{label}</p>
        {children}
      </aside>
    );
  },
  figure({ node: _node, children, ...rest }) {
    const data = rest as DataProps & ComponentProps<"figure">;
    return (
      <figure data-media={data["data-media"]} className={data.className}>
        {children}
      </figure>
    );
  },
  div({ node: _node, children, ...rest }) {
    const data = rest as DataProps & ComponentProps<"div">;
    const provider = data["data-embed"];
    const id = data["data-embed-id"];
    if (provider === "youtube" && id) {
      return (
        <div className="md-embed">
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}`}
            title={data["data-embed-title"] || "YouTube video"}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            loading="lazy"
          />
        </div>
      );
    }
    if (provider === "vimeo" && id) {
      return (
        <div className="md-embed">
          <iframe
            src={`https://player.vimeo.com/video/${encodeURIComponent(id)}`}
            title={data["data-embed-title"] || "Vimeo video"}
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
            loading="lazy"
          />
        </div>
      );
    }
    return <div className={data.className}>{children}</div>;
  },
  video({ node: _node, ...props }) {
    return <video {...props} controls preload="metadata" playsInline />;
  },
  audio({ node: _node, ...props }) {
    return <audio {...props} controls preload="metadata" />;
  },
  table({ node: _node, children, ...props }) {
    return (
      <div className="md-table">
        <table {...props}>{children}</table>
      </div>
    );
  },
  pre({ node, children, ...props }) {
    const codeNode = node?.children.find((child) => child.type === "element" && child.tagName === "code");
    const meta = codeNode && codeNode.type === "element" ? codeNode.data?.meta : undefined;
    const title = codeTitle(meta);
    return (
      <div className="md-code">
        {title ? <div className="md-code-title">{title}</div> : null}
        <pre {...props}>{children}</pre>
      </div>
    );
  },
  input({ node: _node, ...props }) {
    return <input {...props} disabled readOnly />;
  },
};

type MarkdownPreviewProps = {
  value: string;
  className?: string;
  /** Shown when there is nothing to render. */
  empty?: ReactNode;
};

function MarkdownPreviewBase({ value, className, empty }: MarkdownPreviewProps) {
  if (!value.trim()) {
    return <p className={cn("text-[0.8125rem] text-ink-soft", className)}>{empty ?? "Nothing to preview yet."}</p>;
  }
  return (
    <div className={cn("md", className)}>
      <ReactMarkdown remarkPlugins={REMARK_PLUGINS} rehypePlugins={REHYPE_PLUGINS} components={components} skipHtml>
        {value}
      </ReactMarkdown>
    </div>
  );
}

/** The site's dialect, rendered live. Memoised: parsing a long document is not free. */
export const MarkdownPreview = memo(MarkdownPreviewBase);
