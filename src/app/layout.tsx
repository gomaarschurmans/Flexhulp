import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  weight: ["400", "500", "600"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["400", "500", "600", "700"],
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.flexhulp.be";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Flexhulp",
  description: "Klussen & opdrachten voor studenten",
  openGraph: {
    title: "Flexhulp",
    description: "Klussen & opdrachten voor studenten",
    url: SITE_URL,
    siteName: "Flexhulp",
    images: [{ url: "/flexhulp-logo.png" }],
    locale: "nl_BE",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Flexhulp",
    description: "Klussen & opdrachten voor studenten",
    images: ["/flexhulp-logo.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="nl">
      <body className={`${fraunces.variable} ${inter.variable} font-sans`}>
        {children}
      </body>
    </html>
  );
}
