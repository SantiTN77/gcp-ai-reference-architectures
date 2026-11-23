import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Enterprise GCP + AI Reference Architectures & ADRs",
  description:
    "Production-grade GCP + AI reference architectures, verified Mermaid security & sequence diagrams, quantitative FinOps cost models, STRIDE/OWASP threat models, and MADR decision records.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen antialiased bg-[#090d16] text-slate-200 selection:bg-emerald-500/30 selection:text-emerald-200">
        <Navbar />
        <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">{children}</main>
        <footer className="border-t border-slate-800/80 mt-16 py-8 text-center text-xs text-slate-500">
          <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>Enterprise GCP + AI Reference Architectures &amp; ADRs (&ldquo;Repo sin humo&rdquo;)</span>
            <span>Zero Idle Cost Policy &bull; Cloud Run v2 &bull; Firestore Vector Search &bull; Cloud DLP &bull; VPC-SC</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
