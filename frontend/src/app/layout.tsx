import type { Metadata } from "next";
import { Geist, Geist_Mono, Montserrat, Playfair_Display, David_Libre, Poppins } from "next/font/google";
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

const PlayfairDisplay = Playfair_Display({
  variable: "--font-play",
  weight: ["500", "400"],
  subsets: ["latin"],
  display: "swap",
});

const poppins = Poppins({
  variable: "--font-play",
  weight: ["500", "400"],
  subsets: ["latin"],
  display: "swap",
});

const DavidLibre = David_Libre({
  variable: "--font-libre",
  weight: ["500", "400"],
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
  authors: [{ name: "Husain Jafar", url: "https://diffrun.com" }],
  creator: "Husain Jafar",
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
        url: "/diffrun.png",
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
    images: ["/diffrun.png"],
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

      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${poppins.variable} ${DavidLibre.variable}  ${PlayfairDisplay.variable} ${montserrat.variable} antialiased`}
      >
        <p className="bg-[#1a5fb4] text-base md:text-lg text-white flex items-center font-libre font-medium justify-center py-2 leading-tight">
          <span>Delivered anywhere in India</span>
          <img
            src="/india.png"
            alt="India"
            className="h-4 w-auto align-middle mx-2 inline"
            width="27"
            height="18"
          />
          <span>in 7 days</span>
        </p>
        <Header />
        {children}
        <Footer />
      </body>
      <Script
        src="https://static.elfsight.com/platform/platform.js"
        strategy="lazyOnload"
      />
    </html>
  );
}