import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Petspace",
  description: "宠物生活分享社交平台",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className="antialiased">
        <ClerkProvider
          appearance={{
            variables: {
              colorPrimary: "#e46645",
              colorText: "#17120d",
              colorBackground: "#fffaf1",
              borderRadius: "0.5rem",
            },
          }}
        >
          {children}
        </ClerkProvider>
        <Analytics />
      </body>
    </html>
  );
}
