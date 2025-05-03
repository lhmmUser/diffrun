import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/custom/Header";
import Footer from "@/components/custom/Footer";
import Link from "next/link"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Diffrun | Create Your Story - Unlock Your Creativity",
  description:
    "Diffrun is a platform designed to inspire and empower creators to craft their unique stories. Whether you're writing, drawing, or building, we provide the tools and resources to bring your ideas to life.",
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
    title: "Diffrun | Create Your Story - Unlock Your Creativity",
    description:
      "Diffrun is a platform designed to inspire and empower creators to craft their unique stories. Whether you're writing, drawing, or building, we provide the tools and resources to bring your ideas to life.",
    url: "https://diffrun.com",
    siteName: "Diffrun",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Diffrun | Create Your Story - Unlock Your Creativity",
    description:
      "Diffrun is a platform designed to inspire and empower creators to craft their unique stories. Whether you're writing, drawing, or building, we provide the tools and resources to bring your ideas to life.",
    site: "@diffrun", 
    creator: "@diffrun",
    images: [
      "https://diffrun.com/images/og-image.jpg",
    ],
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
        <link rel="canonical" href="https://diffrun.com" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Header />
        <div className="w-full bg-indigo-100 text-center py-3">
          <p className="text-sm sm:text-base text-gray-800 font-medium">
            We're still in beta version. If you encounter any issues,{" "}
            <Link
              href="https://docs.google.com/forms/d/e/1FAIpQLScNkvCTCPXmSiGhW7ssAhkR_bHjOfuSD6mOBRL3X-MwjZtl_w/viewform?pli=1"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-950 underline hover:text-gray-600"
            >
              let us know
            </Link>.
          </p>
        </div>
        {children}
        <Footer />
      </body>
    </html>
  );
}