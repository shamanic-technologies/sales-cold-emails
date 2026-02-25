import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
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
  metadataBase: new URL("https://salescoldemails.com"),
  title: {
    default: "Sales Cold Emails",
    template: "%s | Sales Cold Emails",
  },
  description:
    "AI-powered cold email campaigns. Free with BYOK or pay-as-you-go with zero markup.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  const body = (
    <body
      className={`${geistSans.variable} ${geistMono.variable} antialiased`}
    >
      {children}
    </body>
  );

  return (
    <html lang="en">
      {publishableKey ? (
        <ClerkProvider publishableKey={publishableKey}>{body}</ClerkProvider>
      ) : (
        body
      )}
    </html>
  );
}
