import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { T } from "@/components/T";

const sans = Geist({ subsets: ["latin"], variable: "--font-geist", display: "swap" });
const mono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono", display: "swap" });
const serif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-instrument",
  display: "swap",
});

export const metadata: Metadata = {
  title: "GCP + AI Reference Architectures & ADRs",
  description:
    "Production-grade GCP + AI reference architectures: verified Mermaid security and sequence diagrams, quantitative FinOps cost models, STRIDE/OWASP threat models and MADR decision records.",
};

export const viewport: Viewport = { themeColor: "#F3F1EA" };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable} ${serif.variable}`}>
      <body className="min-h-screen bg-paper font-sans text-ink antialiased">
        <Navbar />
        <main className="mx-auto max-w-[1280px] px-5 pb-10 sm:px-8">{children}</main>
        <footer className="mx-auto mt-24 max-w-[1280px] px-5 sm:px-8">
          <div className="flex flex-col items-start justify-between gap-2 border-t border-line py-6 font-mono text-[11px] text-ink-muted sm:flex-row sm:items-center">
            <span>
              <T k="built" />
            </span>
            <a href="https://danieltafur.vercel.app" target="_blank" rel="noopener noreferrer" className="hover:text-ink">
              danieltafur.vercel.app ↗
            </a>
          </div>
        </footer>
      </body>
    </html>
  );
}
