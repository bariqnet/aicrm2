import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Lightfield-style Simple CRM",
  description: "Modern minimal CRM demo"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
