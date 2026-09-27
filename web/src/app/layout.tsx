import type { Metadata, Viewport } from "next";
import { Archivo, IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import { InlineScript } from "@/components/site/InlineScript";
import { getSettings } from "@/lib/data/settings";
import { siteUrl } from "@/lib/site";
import "./globals.css";

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin", "latin-ext"],
  axes: ["wdth"],
  display: "swap",
});

const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin", "latin-ext"],
  style: ["normal", "italic"],
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
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
    { media: "(prefers-color-scheme: light)", color: "#f1f3f4" },
    { media: "(prefers-color-scheme: dark)", color: "#0c1422" },
  ],
};

// Runs before first paint: applies a saved theme and drops the no-js flag.
const bootScript = `(function(){var d=document.documentElement;d.classList.remove("no-js");try{var t=localStorage.getItem("theme");if(t==="light"||t==="dark")d.setAttribute("data-theme",t)}catch(e){}})()`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`no-js ${archivo.variable} ${plexSans.variable} ${plexMono.variable}`}
      suppressHydrationWarning
    >
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
