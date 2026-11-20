import type { Metadata } from "next";

import AppChrome from "@/components/app-chrome";
import "./globals.css";
import "./refinement.css";

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
    <html lang="ko" className="font-sans">
      <body>
        <AppChrome>{children}</AppChrome>
      </body>
    </html>
  );
}
