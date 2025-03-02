import type { Metadata } from "next";
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import "./globals.css";

export const metadata: Metadata = {
  title: "Claude Chat",
  description: "A modern chat interface for Claude",
  viewport: "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable} antialiased h-full`}>
      <body className="h-full overflow-hidden relative">
        <div className="absolute inset-0 overflow-hidden">
          {children}
        </div>
      </body>
    </html>
  );
}
