import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: {
    default: "BlueCollr — Professional Estimates for Trade Contractors",
    template: "%s — BlueCollr",
  },
  description:
    "BlueCollr helps plumbers, electricians, HVAC techs, roofers, and painters generate branded PDF estimates in 60 seconds. No subscription, no sign-up required.",
  openGraph: {
    title: "BlueCollr — Professional Estimates for Trade Contractors",
    description:
      "Generate branded PDF estimates in 60 seconds. Built for plumbers, electricians, HVAC techs, roofers, and painters.",
    type: "website",
    locale: "en_US",
    siteName: "BlueCollr",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col text-base">{children}</body>
    </html>
  );
}
