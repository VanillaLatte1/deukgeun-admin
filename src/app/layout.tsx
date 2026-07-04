import type { Metadata } from "next";
import { Geist } from "next/font/google";

import AppChrome from "@/components/app-chrome";
import { cn } from "@/lib/utils";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "득근둑근 Backoffice",
  description: "운동 모임 운영진 백오피스",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={cn("font-sans", geist.variable)}>
      <body>
        <AppChrome>{children}</AppChrome>
      </body>
    </html>
  );
}
