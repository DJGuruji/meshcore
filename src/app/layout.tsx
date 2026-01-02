import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "aos/dist/aos.css"; // AOS styles
import AOSInitializer from "@/components/AOSInitializer";
import AuthProvider from "@/components/AuthProvider";
import Header from "@/components/Header";
import PageLoader from "@/components/PageLoader";
import { NavigationStateProvider } from "@/contexts/NavigationStateContext";
import StructuredData from "@/components/StructuredData";
import ConditionalFooter from "@/components/ConditionalFooter";
import GridBackground from "@/components/GridBackground";
import { siteConfig, ogImage } from "@/lib/seoConfig";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} – Mock Server & API Tester`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: siteConfig.keywords,
  applicationName: siteConfig.name,
  creator: siteConfig.name,
  publisher: siteConfig.name,
  category: "technology",
  alternates: {
    canonical: siteConfig.url,
  },
  openGraph: {
    type: "website",
    url: siteConfig.url,
    title: `${siteConfig.name} – Mock server online & API playground`,
    description: siteConfig.description,
    siteName: siteConfig.name,
    images: [
      {
        url: ogImage,
        width: 1200,
        height: 630,
        alt: "AnyTimeRequest mock server and API tester",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteConfig.name} – fake API generator & request tester`,
    description: siteConfig.description,
    creator: siteConfig.socials.twitter,
    images: [ogImage],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  icons: {
    icon: "/favicon.png?v=3",
    shortcut: "/favicon.ico?v=3",
    apple: "/favicon.png?v=3",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} antialiased bg-gradient-to-br from-black min-h-screen text-yellow-400`}
      >
        {/* Global Grid Background */}
        <GridBackground />
        
        <AuthProvider>
          <NavigationStateProvider>
            <AOSInitializer>
              <PageLoader />
              <div className="flex flex-col min-h-screen">
                <Header />
                <main className="flex-grow">
                  {children}
                </main>
                <ConditionalFooter />
              </div>
            </AOSInitializer>
          </NavigationStateProvider>
        </AuthProvider>
        <StructuredData />
      </body>
    </html>
  );
}
