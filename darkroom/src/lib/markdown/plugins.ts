/**
 * Content dialect shared by the public site and the admin preview.
 * Keep this file identical in `web/` and `admin/` (it has no app imports).
 *
 *   > [!NOTE] / [!TIP] / [!IMPORTANT] / [!WARNING] / [!CAUTION]   callouts
 *   :::details[Summary] ... :::                                    disclosure
 *   ![alt](file.mp4) / ![alt](file.mp3)                           video / audio
 *   ![alt](image.png "Caption")                                   figure + caption
 *   a YouTube or Vimeo link alone on a line                        embed
 */
import type { Root as MdastRoot, Paragraph, Image, Link, Blockquote, Text } from "mdast";
import { visit, SKIP } from "unist-util-visit";

const VIDEO_EXT = /\.(mp4|webm|mov|m4v)(\?.*)?$/i;
const AUDIO_EXT = /\.(mp3|wav|ogg|m4a|flac)(\?.*)?$/i;

export type EmbedTarget = { provider: "youtube" | "vimeo"; id: string };

export function parseEmbedUrl(url: string): EmbedTarget | null {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");
    if (host === "youtu.be") {
      const id = u.pathname.slice(1).split("/")[0];
      return id ? { provider: "youtube", id } : null;
    }
    if (host === "youtube.com" || host === "m.youtube.com" || host === "youtube-nocookie.com") {
      if (u.pathname === "/watch") {
        const id = u.searchParams.get("v");
        return id ? { provider: "youtube", id } : null;
      }
      const m = u.pathname.match(/^\/(embed|shorts|live)\/([^/?]+)/);
      return m ? { provider: "youtube", id: m[2] } : null;
    }
    if (host === "vimeo.com" || host === "player.vimeo.com") {
      const m = u.pathname.match(/(\d{6,})/);
      return m ? { provider: "vimeo", id: m[1] } : null;
    }
  } catch {
    /* not a URL */
  }
  return null;
}

const ALERT = /^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*/i;

/** `> [!NOTE]` blockquotes become <aside data-callout="note">. */
export function remarkAlerts() {
  return (tree: MdastRoot) => {
    visit(tree, "blockquote", (node: Blockquote) => {
      const first = node.children[0];
      if (!first || first.type !== "paragraph") return;
      const lead = first.children[0];
      if (!lead || lead.type !== "text") return;
      const match = (lead as Text).value.match(ALERT);
      if (!match) return;

      const kind = match[1].toLowerCase();
      (lead as Text).value = (lead as Text).value.slice(match[0].length).replace(/^\n/, "");
      if ((lead as Text).value === "") first.children.shift();
      if (first.children.length === 0) node.children.shift();

      node.data = {
        ...node.data,
        hName: "aside",
        hProperties: { dataCallout: kind },
      };
    });
  };
}

/** `:::details[Summary]` container directives become <details>. */
export function remarkDetails() {
  return (tree: MdastRoot) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    visit(tree, (node: any) => {
      if (node.type !== "containerDirective" || node.name !== "details") return;

      let summary = "Details";
      const label = node.children[0];
      if (label?.data?.directiveLabel) {
        summary = (label.children ?? [])
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .map((c: any) => c.value ?? "")
          .join("")
          .trim() || summary;
        node.children.shift();
      }

      node.data = { ...node.data, hName: "details" };
      node.children.unshift({
        type: "paragraph",
        data: { hName: "summary" },
        children: [{ type: "text", value: summary }],
      });
    });
  };
}

/**
 * Paragraphs that hold exactly one image or one link are promoted:
 * media files become players, captioned images become figures, and bare
 * YouTube / Vimeo links become embeds.
 */
export function remarkMedia() {
  return (tree: MdastRoot) => {
    visit(tree, "paragraph", (node: Paragraph, index, parent) => {
      if (!parent || index === undefined || node.children.length !== 1) return;
      const only = node.children[0];

      if (only.type === "image") {
        const image = only as Image;
        const url = image.url ?? "";
        const caption = image.title ?? "";

        if (VIDEO_EXT.test(url) || AUDIO_EXT.test(url)) {
          const isVideo = VIDEO_EXT.test(url);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (parent.children as any[])[index] = {
            type: "mediaFigure",
            data: { hName: "figure", hProperties: { dataMedia: isVideo ? "video" : "audio" } },
            children: [
              {
                type: "mediaPlayer",
                data: {
                  hName: isVideo ? "video" : "audio",
                  hProperties: {
                    src: url,
                    controls: true,
                    preload: "metadata",
                    ...(isVideo ? { playsInline: true } : {}),
                    ariaLabel: image.alt || undefined,
                  },
                },
                children: [],
              },
              ...(caption || image.alt
                ? [
                    {
                      type: "mediaCaption",
                      data: { hName: "figcaption" },
                      children: [{ type: "text", value: caption || image.alt || "" }],
                    },
                  ]
                : []),
            ],
          };
          return SKIP;
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (parent.children as any[])[index] = {
          type: "mediaFigure",
          data: { hName: "figure", hProperties: { dataMedia: "image" } },
          children: [
            { ...image, title: null },
            ...(caption
              ? [
                  {
                    type: "mediaCaption",
                    data: { hName: "figcaption" },
                    children: [{ type: "text", value: caption }],
                  },
                ]
              : []),
          ],
        };
        return SKIP;
      }

      if (only.type === "link") {
        const link = only as Link;
        const target = parseEmbedUrl(link.url);
        if (!target) return;
        const label = link.children
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .map((c: any) => c.value ?? "")
          .join("")
          .trim();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (parent.children as any[])[index] = {
          type: "mediaEmbed",
          data: {
            hName: "div",
            hProperties: {
              dataEmbed: target.provider,
              dataEmbedId: target.id,
              dataEmbedTitle: label && label !== link.url ? label : "",
            },
          },
          children: [],
        };
        return SKIP;
      }
    });
  };
}

/**
 * remark-directive also parses inline `:name` and leaf `::name` forms. The
 * dialect only uses the `:::details` container, so anything else is put back
 * as the text the author typed (otherwise "ratio 3:b" would lose ":b").
 */
export function remarkDirectiveFallback() {
  return (tree: MdastRoot) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    visit(tree, (node: any, index, parent: any) => {
      if (!parent || index === undefined) return;
      const isText = node.type === "textDirective";
      const isLeaf = node.type === "leafDirective";
      const isUnknownContainer = node.type === "containerDirective" && node.name !== "details";
      if (!isText && !isLeaf && !isUnknownContainer) return;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const inner = (node.children ?? []).map((c: any) => c.value ?? "").join("");
      const prefix = isText ? ":" : isLeaf ? "::" : ":::";
      const value = `${prefix}${node.name ?? ""}${inner ? `[${inner}]` : ""}`;
      parent.children[index] = isText ? { type: "text", value } : { type: "paragraph", children: [{ type: "text", value }] };
      return SKIP;
    });
  };
}

export type TocEntry = { depth: 2 | 3; text: string; id: string };
