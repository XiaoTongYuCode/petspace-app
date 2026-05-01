import type { MetadataRoute } from "next";
import { getFeedPosts } from "@/lib/data";
import { getCanonicalUrl } from "@/lib/seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await getFeedPosts(100);
  const latestPostDate = posts[0]?.createdAt
    ? new Date(posts[0].createdAt)
    : new Date();
  const authorHandles = Array.from(
    new Set(posts.map((post) => post.author.handle).filter(Boolean)),
  );

  return [
    {
      url: getCanonicalUrl("/").toString(),
      lastModified: latestPostDate,
      changeFrequency: "hourly",
      priority: 1,
    },
    ...authorHandles.map((handle) => ({
      url: getCanonicalUrl(`/u/${handle}`).toString(),
      lastModified: latestPostDate,
      changeFrequency: "daily" as const,
      priority: 0.7,
    })),
    ...posts.map((post) => ({
      url: getCanonicalUrl(`/post/${post.id}`).toString(),
      lastModified: new Date(post.createdAt),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
