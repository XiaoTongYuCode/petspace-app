import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Analytics } from "@vercel/analytics/next";
import { LobeToastProvider } from "@/components/lobe-toast-provider";
import {
  SITE_DESCRIPTION,
  SITE_KEYWORDS,
  SITE_NAME,
  getSiteUrl,
  organizationJsonLd,
} from "@/lib/seo";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: getSiteUrl(),
  applicationName: SITE_NAME,
  title: {
    default: "Petspace | 宠物生活分享社区",
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: SITE_KEYWORDS,
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  category: "宠物社交",
  icons: {
    icon: "/favicon.ico",
    apple: "/brand/petspace-logo.png",
  },
  openGraph: {
    title: "Petspace | 宠物生活分享社区",
    description: SITE_DESCRIPTION,
    siteName: SITE_NAME,
    locale: "zh_CN",
    type: "website",
    images: [
      {
        url: "/brand/petspace-logo.png",
        width: 1200,
        height: 630,
        alt: "Petspace",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Petspace | 宠物生活分享社区",
    description: SITE_DESCRIPTION,
    images: ["/brand/petspace-logo.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
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
          <LobeToastProvider />
        </ClerkProvider>
        <script
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationJsonLd()).replace(/</g, "\\u003c"),
          }}
        />
        <Analytics />
      </body>
    </html>
  );
}
