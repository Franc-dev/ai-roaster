import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AI Roaster & Praiser",
  description: "Get roasted or praised by AI based on your name and career!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.className} antialiased bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600 text-slate-900 min-h-screen flex flex-col`}
       suppressHydrationWarning>
        {/*
          Updated Tailwind classes for body:
          - from-brand-amber -> from-amber-500
          - via-brand-orange -> via-orange-500
          (to-amber-600 was already a default shade)
        */}
        {children}
      </body>
    </html>
  );
}