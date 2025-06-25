import type { Metadata } from "next";
import { David_Libre, Poppins } from "next/font/google";
import "./globals.css";
import Header from "@/components/custom/Header";
import Footer from "@/components/custom/Footer";
import Script from "next/script";

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
    "storybook gift with child as hero",
    "photo storybooks for kids",
    "personalized baby books with pictures",
    "personalized toddler books with name and photo",
    "personalized keepsake storybook",
    "custom children's literature",
    "magical adventure books",
    "personalized children's books india",
    "buy kids storybooks online india",
    "best storybook printing india",
    "7-day delivery kids books india",
    "unique gift for children birthday india",
    "magical storybook gift for kids",
    "meaningful gifts for children",
    "gift ideas for toddlers with photo",
    "memory book for children",
    "turn child photo into book",
    "AI generated children's storybooks",
    "storybooks using your child's face",
    "adventure books for kids with custom faces",
    "creative story builder for kids",
    "custom books for early learning",
    "storytelling platform",
    "creative writing",
    "digital storytelling",
    "unlock creativity",
    "writing tools",
    "creative inspiration",
    "story builder",
    "Diffrun personalized books",
    "Diffrun story creator",
    "Diffrun custom storybooks",
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
        {/* Google Tag Manager */}
        <script dangerouslySetInnerHTML={{
          __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-PKBNXSM5');`
        }} />
        {/* End Google Tag Manager */}
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#ffffff" />
        <meta name="format-detection" content="telephone=no, date=no, email=no, address=no" />
        <link rel="icon" href="/favicon.ico" />
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
        className={`${poppins.variable} ${DavidLibre.variable} antialiased`}
      >
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-PKBNXSM5"
            height="0"
            width="0"
            style={{ display: 'none', visibility: 'hidden' }}
          />
        </noscript>
        {/* End Google Tag Manager (noscript) */}
        <p className="bg-[#5784ba] text-base md:text-lg text-white flex items-center font-libre font-thin justify-center py-2">
          Printing and Delivery across Canada, India, UK and US
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