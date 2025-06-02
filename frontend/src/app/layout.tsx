import type { Metadata } from "next";
import { Geist, Geist_Mono, Montserrat } from "next/font/google";
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

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Diffrun | Personalised books that say — you're the hero",
  description:
    "Create personalized storybooks where your child is the hero. Diffrun lets you turn their photo into a magical adventure — the perfect gift they'll never forget",
  keywords: [
    "personalized children's books",
    "custom storybooks",
    "children's photo books",
    "personalized gifts for kids",
    "create your story",
    "storytelling platform",
    "creative writing",
    "digital storytelling",
    "unlock creativity",
    "writing tools",
    "creative inspiration",
    "story builder",
    "custom children's literature",
    "magical adventure books",
  ],
  authors: [{ name: "Kush", url: "https://diffrun.com" }],
  creator: "Kush Sharma",
  publisher: "Lighthouse Generic",
  metadataBase: new URL("https://diffrun.com"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Diffrun | Personalised books that say — you're the hero",
    description:
      "Create personalized storybooks where your child is the hero. Diffrun lets you turn their photo into a magical adventure — the perfect gift they'll never forget",
    url: "https://diffrun.com",
    siteName: "Diffrun",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/web-banner.jpg",
        width: 1200,
        height: 630,
        alt: "Diffrun - Create personalized storybooks for children",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Diffrun | Personalised books that say — you're the hero",
    description:
      "Create personalized storybooks where your child is the hero. Diffrun lets you turn their photo into a magical adventure — the perfect gift they'll never forget",
    site: "@diffrun",
    creator: "@diffrun",
    images: ["/web-banner.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  category: "Children's Books",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#ffffff" />
        <meta name="format-detection" content="telephone=no, date=no, email=no, address=no" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-H85K60DDFD"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-H85K60DDFD');
          `}
        </Script>
        <Script
          id="structured-data"
          type="application/ld+json"
          strategy="beforeInteractive"
        >
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            name: "Diffrun",
            url: "https://diffrun.com",
            logo: "https://diffrun.com/diffrun.png",
            description: "Create personalized storybooks where your child is the hero. Diffrun lets you turn their photo into a magical adventure — the perfect gift they'll never forget",
            founder: {
              "@type": "Person",
              name: "Husain Jafar"
            },
            sameAs: [
              "https://twitter.com/diffrun"
            ],
            mainEntity: {
              "@type": "Service",
              name: "Personalized Children's Storybooks",
              description: "Custom storybook creation service where children become the heroes of their own adventures",
              serviceType: "Creative Services",
              areaServed: "Worldwide",
              hasOfferCatalog: {
                "@type": "OfferCatalog",
                name: "Personalized Storybooks",
                itemListElement: [
                  {
                    "@type": "Offer",
                    itemOffered: {
                      "@type": "Product",
                      name: "Custom Children's Storybook",
                      category: "Children's Books"
                    }
                  }
                ]
              }
            }
          })}
        </Script>
        <Script
          src="https://static.elfsight.com/platform/platform.js"
          strategy="lazyOnload"
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} ${montserrat.variable} antialiased`}>
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}