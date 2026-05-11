import type { Metadata } from "next";
import { Playfair_Display, Source_Sans_3, JetBrains_Mono } from "next/font/google";
import { ToastProvider } from "@/components/ui/ToastNotification";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-display",
});

const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-body",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Bank Licensing & Compliance Portal | BNR",
  description: "Official Licensing and Compliance Portal for the National Bank of Rwanda",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${playfair.variable} ${sourceSans.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
