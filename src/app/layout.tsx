import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "aos/dist/aos.css"; // AOS styles
import AOSInitializer from "@/components/AOSInitializer";
import AuthProvider from "@/components/AuthProvider";
import Header from "@/components/Header";
import { NavigationStateProvider } from "@/contexts/NavigationStateContext";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AnyTimeRequest API Tester and Mock Server",
  description: "Create Mock server and use api tester with AnyTimeRequest",
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
        <AuthProvider>
          <NavigationStateProvider>
            <AOSInitializer>
              <div className="flex flex-col min-h-screen">
                <Header />
                <main className="flex-grow">
                  {children}
                </main>
              </div>
            </AOSInitializer>
          </NavigationStateProvider>
        </AuthProvider>
      </body>
    </html>
  );
}