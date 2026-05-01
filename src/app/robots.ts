import type { MetadataRoute } from "next";
import { getCanonicalUrl, getSiteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/post/", "/u/"],
        disallow: ["/api/", "/compose", "/favorites", "/me"],
      },
    ],
    sitemap: getCanonicalUrl("/sitemap.xml").toString(),
    host: getSiteUrl().toString(),
  };
}
