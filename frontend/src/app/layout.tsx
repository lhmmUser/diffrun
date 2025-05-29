import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/custom/Header";
import Footer from "@/components/custom/Footer";
import Script from "next/script";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Diffrun | Personalised books that say — you're the hero",
  description:
    "Create personalized storybooks where your child is the hero. Diffrun lets you turn their photo into a magical adventure — the perfect gift they'll never forget",
  keywords: [
    "create your story",
    "storytelling platform",
    "creative writing",
    "digital storytelling",
    "unlock creativity",
    "writing tools",
    "creative inspiration",
    "story builder",
  ],
  authors: [{ name: "Kush", url: "https://diffrun.com" }],
  creator: "Kush Sharma",
  publisher: "Lighthouse Generic",
  openGraph: {
    title: "Diffrun | Personalised books that say — you're the hero",
    description:
      "Create personalized storybooks where your child is the hero. Diffrun lets you turn their photo into a magical adventure — the perfect gift they'll never forget",
    url: "https://diffrun.com",
    siteName: "Diffrun",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Diffrun | Personalised books that say — you're the hero",
    description:
      "Create personalized storybooks where your child is the hero. Diffrun lets you turn their photo into a magical adventure — the perfect gift they'll never forget",
    site: "@diffrun", 
    creator: "@diffrun",
  },
  robots: "index, follow",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Script
          src="https://static.elfsight.com/platform/platform.js"
          strategy="lazyOnload"
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}