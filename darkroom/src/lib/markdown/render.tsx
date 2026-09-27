import "server-only";
import type { Element, Root as HastRoot, ElementContent } from "hast";
import { toJsxRuntime, type Components } from "hast-util-to-jsx-runtime";
import { toString as hastToString } from "hast-util-to-string";
import Link from "next/link";
import type { ReactNode } from "react";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import rehypeKatex from "rehype-katex";
import rehypePrettyCode from "rehype-pretty-code";
import rehypeSlug from "rehype-slug";
import remarkDirective from "remark-directive";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import { visit } from "unist-util-visit";
import { Embed } from "@/components/content/Embed";
import { publicDb } from "@/lib/supabase/server";
import { remarkAlerts, remarkDetails, remarkDirectiveFallback, remarkMedia, type TocEntry } from "./plugins";

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkMath)
  .use(remarkDirective)
  .use(remarkAlerts)
  .use(remarkDetails)
  .use(remarkDirectiveFallback)
  .use(remarkMedia)
  .use(remarkRehype)
  .use(rehypeKatex)
  .use(rehypePrettyCode, {
    // The plain github-light theme puts keywords at 4.11:1 on this paper,
    // which fails AA for body-sized text. Code is text, so it has to pass.
    theme: { light: "github-light-high-contrast", dark: "github-dark-dimmed" },
    keepBackground: false,
    defaultLang: { block: "plaintext", inline: "plaintext" },
    bypassInlineCode: true,
  })
  .use(rehypeSlug);

type Dimensions = Map<string, { width: number; height: number }>;

/** Known intrinsic sizes keep images from shifting the page as they load. */
async function lookupDimensions(urls: string[]): Promise<Dimensions> {
  const found: Dimensions = new Map();
  const db = publicDb();
  if (!db || urls.length === 0) return found;
  const { data } = await db.from("media_assets").select("url, width, height").in("url", urls.slice(0, 100));
  for (const row of data ?? []) {
    if (row.width && row.height) found.set(row.url, { width: row.width, height: row.height });
  }
  return found;
}

function isExternal(href: string) {
  return /^(https?:)?\/\//i.test(href) || href.startsWith("mailto:");
}

function buildComponents(dimensions: Dimensions): Partial<Components> {
  return {
    a({ href = "", children, node, ...rest }) {
      void node;
      if (isExternal(href)) {
        return (
          <a href={href} target="_blank" rel="noopener noreferrer" {...rest}>
            {children}
          </a>
        );
      }
      // The home page runs its own scroll engine, so it is always a full load.
      if (href === "/" || href.startsWith("#")) {
        return (
          <a href={href} {...rest}>
            {children}
          </a>
        );
      }
      return (
        <Link href={href} {...rest}>
          {children}
        </Link>
      );
    },
    img({ src, alt = "", node, ...rest }) {
      void node;
      const url = typeof src === "string" ? src : "";
      const size = dimensions.get(url);
      return (
        // Content images can come from any host the author pastes, so they are plain <img>.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={alt} loading="lazy" decoding="async" width={size?.width} height={size?.height} {...rest} />
      );
    },
    table({ children, node, ...rest }) {
      void node;
      return (
        <div className="table-scroll">
          <table {...rest}>{children}</table>
        </div>
      );
    },
    figure({ children, node, ...rest }) {
      const props = node?.properties ?? {};
      if ("dataRehypePrettyCodeFigure" in props) return <div className="code-block">{children}</div>;
      return <figure {...rest}>{children}</figure>;
    },
    figcaption({ children, node, ...rest }) {
      const props = node?.properties ?? {};
      if ("dataRehypePrettyCodeTitle" in props) return <div className="code-block__title">{children}</div>;
      return <figcaption {...rest}>{children}</figcaption>;
    },
    div({ children, node, ...rest }) {
      const props = node?.properties ?? {};
      const provider = props.dataEmbed;
      if (provider === "youtube" || provider === "vimeo") {
        return <Embed provider={provider} id={String(props.dataEmbedId ?? "")} title={String(props.dataEmbedTitle ?? "")} />;
      }
      return <div {...rest}>{children}</div>;
    },
  };
}

export type RenderedMarkdown = { content: ReactNode; toc: TocEntry[] };

export async function renderMarkdown(markdown: string): Promise<RenderedMarkdown> {
  if (!markdown.trim()) return { content: null, toc: [] };

  const tree = (await processor.run(processor.parse(markdown))) as HastRoot;

  const toc: TocEntry[] = [];
  const imageUrls: string[] = [];
  visit(tree, "element", (node: Element) => {
    if ((node.tagName === "h2" || node.tagName === "h3") && typeof node.properties.id === "string") {
      toc.push({ depth: node.tagName === "h2" ? 2 : 3, text: hastToString(node), id: node.properties.id });
    }
    if (node.tagName === "img" && typeof node.properties.src === "string") imageUrls.push(node.properties.src);
  });

  // Footnote section heading is generated by remark-gfm; keep it out of the contents list.
  const filteredToc = toc.filter((entry) => entry.id !== "footnote-label");

  const dimensions = await lookupDimensions(imageUrls);
  const content = toJsxRuntime(tree as HastRoot & { children: ElementContent[] }, {
    Fragment,
    jsx,
    jsxs,
    components: buildComponents(dimensions),
    ignoreInvalidStyle: true,
    passNode: true,
  });

  return { content, toc: filteredToc };
}
