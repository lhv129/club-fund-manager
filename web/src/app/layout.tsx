import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "react-hot-toast";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Club Fund Manager",
  description: "Club Fund Management System",
};

/**
 * Root layout — renders <html> and <body>.
 * Locale-specific providers are in [locale]/layout.tsx.
 *
 * lang="vi" is the initial SSR value; the inline script updates it
 * to match the actual locale from the URL before hydration.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var m=location.pathname.match(/^\\/(vi|en)(\\/|$)/);if(m)document.documentElement.lang=m[1];}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-full">
        <Toaster position="top-right" />
        {children}
      </body>
    </html>
  );
}
