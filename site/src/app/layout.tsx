import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { InlineScript } from "@/components/site/InlineScript";
import { bootScript, toLook } from "@/lib/background";
import { listBackgrounds } from "@/lib/data/backgrounds";
import { getSettings } from "@/lib/data/settings";
import { siteUrl } from "@/lib/site";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin", "latin-ext"],
  style: ["normal", "italic"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin", "latin-ext"],
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
      ...(settings.og_image_url ? { images: [settings.og_image_url] } : {}),
    },
    twitter: { card: "summary_large_image" },
    alternates: { types: { "application/rss+xml": "/feed.xml" } },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fcfcfc" },
    { media: "(prefers-color-scheme: dark)", color: "#0e0f11" },
  ],
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const [settings, backgrounds] = await Promise.all([getSettings(), listBackgrounds()]);

  return (
    <html lang="en" className={`no-js ${geist.variable} ${geistMono.variable}`} suppressHydrationWarning>
      <head>
        {/* Before first paint: the saved theme, the no-js flag and the background. */}
        <InlineScript html={bootScript(backgrounds.map(toLook), settings.background_id, settings.background_picker)} />
      </head>
      <body>
        <div className="site-bg" aria-hidden="true" />
        {children}
      </body>
    </html>
  );
}
