import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const baseUrl = "https://pdf-toolkit-zeta-nine.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "PDF Toolkit — Free Online PDF Tools",
    template: "%s | PDF Toolkit",
  },
  description:
    "Convert, merge, split, compress, and scan PDFs for free. Fast, secure, and private online PDF tools. No installation required.",
  keywords: [
    "PDF",
    "PDF tools",
    "merge PDF",
    "compress PDF",
    "split PDF",
    "PDF to Word",
    "Word to PDF",
    "PDF to Text",
    "Text to PDF",
    "Image to PDF",
    "PDF to Image",
    "OCR",
    "online PDF editor",
    "free PDF converter",
  ],
  authors: [{ name: "Sanim Ahmed Khan" }],
  creator: "Sanim Ahmed Khan",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: baseUrl,
    siteName: "PDF Toolkit",
    title: "PDF Toolkit — Free Online PDF Tools",
    description:
      "Convert, merge, split, compress, and scan PDFs for free. Fast, secure, and private online PDF tools.",
    images: [
      {
        url: `${baseUrl}/opengraph-image.png`,
        width: 1200,
        height: 630,
        alt: "PDF Toolkit",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "PDF Toolkit — Free Online PDF Tools",
    description:
      "Convert, merge, split, compress, and scan PDFs for free. Fast, secure, and private online PDF tools.",
    images: [`${baseUrl}/opengraph-image.png`],
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: baseUrl,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
