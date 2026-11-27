import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import Script from "next/script";
import type { CSSProperties } from "react";
import { SidFot } from "@/components/SidFot";
import { SidHuvud } from "@/components/SidHuvud";
import { brand } from "@/config/brand";
import { plausibleDoman } from "@/lib/analys";
import "./globals.css";

const brod = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-brod",
  display: "swap",
});

// brand.farger → --brand-papper, --brand-primar-mork osv.
const farger = Object.fromEntries(
  Object.entries(brand.farger).map(([namn, varde]) => [
    `--brand-${namn.replace(/[A-Z]/g, (b) => `-${b.toLowerCase()}`)}`,
    varde,
  ]),
) as CSSProperties;

export const metadata: Metadata = {
  metadataBase: new URL(brand.url),
  title: { default: `${brand.namn} – ${brand.slogan}`, template: `%s | ${brand.namn}` },
  description: brand.beskrivning,
  openGraph: { siteName: brand.namn, locale: "sv_SE", type: "website" },
};

export const viewport: Viewport = { themeColor: brand.farger.papper };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="sv" style={farger} className={`${brod.variable} antialiased`}>
      <body className="flex min-h-dvh flex-col">
        <a
          href="#innehall"
          className="sr-only z-50 rounded-md bg-primar px-4 py-3 font-semibold text-white focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
        >
          Hoppa till innehållet
        </a>
        <SidHuvud />
        <main id="innehall" tabIndex={-1} className="flex-1 outline-none">
          {children}
        </main>
        <SidFot />
        {plausibleDoman && (
          <Script
            defer
            data-domain={plausibleDoman}
            src={process.env.NEXT_PUBLIC_PLAUSIBLE_SRC ?? "https://plausible.io/js/script.js"}
          />
        )}
      </body>
    </html>
  );
}
