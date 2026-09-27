import type { Metadata, Viewport } from "next";
import { DM_Mono, League_Gothic, Newsreader } from "next/font/google";
import { InlineScript } from "@/components/site/InlineScript";
import { getSettings } from "@/lib/data/settings";
import { siteUrl } from "@/lib/site";
import "./globals.css";

const league = League_Gothic({
  variable: "--font-league",
  subsets: ["latin", "latin-ext"],
  axes: ["wdth"],
  display: "swap",
});

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin", "latin-ext"],
  style: ["normal", "italic"],
  axes: ["opsz"],
  display: "swap",
});

const dmMono = DM_Mono({
  variable: "--font-dm-mono",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500"],
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  const title = settings.site_title || settings.full_name || "Personal site";
  const description = settings.site_description || settings.headline;
  return {
    metadataBase: new URL(siteUrl(settings.site_url)),
    title: { default: title, template: `%s · ${title}` },
    description,
    openGraph: {
      type: "website",
      siteName: title,
      title,
      description,
      locale: "en_US",
      images: settings.og_image_url ? [settings.og_image_url] : ["/film/projector-poster.jpg"],
    },
    twitter: { card: "summary_large_image" },
    alternates: { types: { "application/rss+xml": "/feed.xml" } },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0c0b0a",
  colorScheme: "dark",
};

// Runs before first paint: drops the no-js flag so scripted reveals may hide.
const bootScript = `document.documentElement.classList.remove("no-js")`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`no-js ${league.variable} ${newsreader.variable} ${dmMono.variable}`} suppressHydrationWarning>
      <head>
        <InlineScript html={bootScript} />
      </head>
      <body>
        {children}
        <div className="grain" aria-hidden="true" />
      </body>
    </html>
  );
}
