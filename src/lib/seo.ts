import type { Metadata } from "next";
import { createElement } from "react";
import type { FeedPost, ProfileSummary } from "@/lib/types";

export const SITE_NAME = "Petspace";
export const SITE_DESCRIPTION =
  "Petspace 是一个记录宠物照片、日常故事、收藏和互动的宠物生活分享社区。";
export const SITE_KEYWORDS = [
  "Petspace",
  "宠物社区",
  "宠物社交",
  "宠物照片",
  "宠物日常",
  "养宠记录",
  "猫咪",
  "狗狗",
];

export function getSiteUrl() {
  const publicSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const vercelUrl = process.env.VERCEL_URL?.trim();
  const configuredUrl = publicSiteUrl || (vercelUrl ? `https://${vercelUrl}` : null);

  return new URL(configuredUrl ?? "http://localhost:3000");
}

export function getCanonicalUrl(path = "/") {
  const url = new URL(path, getSiteUrl());
  url.search = "";
  url.hash = "";

  return url;
}

export function absoluteUrl(pathOrUrl: string | null | undefined) {
  if (!pathOrUrl) {
    return undefined;
  }

  return new URL(pathOrUrl, getSiteUrl()).toString();
}

export function truncateText(value: string, maxLength: number) {
  const cleanValue = value.replace(/\s+/g, " ").trim();

  if (cleanValue.length <= maxLength) {
    return cleanValue;
  }

  return `${cleanValue.slice(0, maxLength - 1)}…`;
}

export function buildPageMetadata({
  description,
  image,
  noIndex = false,
  path,
  title,
}: {
  description: string;
  image?: string | null;
  noIndex?: boolean;
  path: string;
  title: string;
}): Metadata {
  const canonical = getCanonicalUrl(path);
  const imageUrl = absoluteUrl(image) ?? absoluteUrl("/brand/petspace-logo.png");

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: SITE_NAME,
      locale: "zh_CN",
      type: "website",
      images: imageUrl
        ? [
            {
              url: imageUrl,
              width: 1200,
              height: 630,
              alt: title,
            },
          ]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: imageUrl ? [imageUrl] : undefined,
    },
    robots: noIndex
      ? {
          index: false,
          follow: false,
          googleBot: {
            index: false,
            follow: false,
          },
        }
      : {
          index: true,
          follow: true,
        },
  };
}

export function buildPostMetadata(post: FeedPost): Metadata {
  const title = truncateText(post.caption, 34);
  const location = post.location ? `，地点：${post.location}` : "";
  const description = truncateText(
    `${post.author.displayName} 在 Petspace 分享了一条宠物动态${location}。${post.caption}`,
    150,
  );
  const path = `/post/${post.id}`;
  const metadata = buildPageMetadata({
    title,
    description,
    path,
    image: post.imageUrl,
  });

  return {
    ...metadata,
    openGraph: {
      ...metadata.openGraph,
      type: "article",
      publishedTime: post.createdAt,
      authors: [post.author.displayName],
    },
  };
}

export function buildProfileMetadata(profile: ProfileSummary): Metadata {
  return buildPageMetadata({
    title: `${profile.displayName} (@${profile.handle})`,
    description: truncateText(
      `${profile.displayName} 的 Petspace 主页：${profile.bio} 已发布 ${profile.postsCount} 条宠物动态，获得 ${profile.totalLikes} 次点赞。`,
      150,
    ),
    path: `/u/${profile.handle}`,
    image: profile.coverUrl ?? profile.avatarUrl,
  });
}

export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return createElement("script", {
    type: "application/ld+json",
    suppressHydrationWarning: true,
    dangerouslySetInnerHTML: {
      __html: JSON.stringify(data).replace(/</g, "\\u003c"),
    },
  });
}

export function siteJsonLd() {
  const siteUrl = getSiteUrl().toString();

  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: siteUrl,
    description: SITE_DESCRIPTION,
    inLanguage: "zh-CN",
  };
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: getSiteUrl().toString(),
    logo: absoluteUrl("/brand/petspace-logo.png"),
    description: SITE_DESCRIPTION,
  };
}

export function profileJsonLd(profile: ProfileSummary, posts: FeedPost[]) {
  const profileUrl = getCanonicalUrl(`/u/${profile.handle}`).toString();

  return {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    name: `${profile.displayName} 的 Petspace 宠物主页`,
    url: profileUrl,
    description: profile.bio,
    inLanguage: "zh-CN",
    mainEntity: {
      "@type": "Person",
      name: profile.displayName,
      identifier: profile.handle,
      url: profileUrl,
      image: absoluteUrl(profile.avatarUrl ?? profile.coverUrl),
      description: profile.bio,
      interactionStatistic: [
        {
          "@type": "InteractionCounter",
          interactionType: "https://schema.org/LikeAction",
          userInteractionCount: profile.totalLikes,
        },
        {
          "@type": "InteractionCounter",
          interactionType: "https://schema.org/ViewAction",
          userInteractionCount: profile.totalViews + profile.profileViews,
        },
      ],
    },
    hasPart: posts.slice(0, 10).map((post) => ({
      "@type": "SocialMediaPosting",
      headline: truncateText(post.caption, 80),
      url: getCanonicalUrl(`/post/${post.id}`).toString(),
      datePublished: post.createdAt,
      image: absoluteUrl(post.imageUrl),
      author: {
        "@type": "Person",
        name: post.author.displayName,
        url: getCanonicalUrl(`/u/${post.author.handle}`).toString(),
      },
    })),
  };
}

export function postJsonLd(post: FeedPost) {
  return {
    "@context": "https://schema.org",
    "@type": "SocialMediaPosting",
    headline: truncateText(post.caption, 80),
    articleBody: post.caption,
    datePublished: post.createdAt,
    image: absoluteUrl(post.imageUrl),
    url: getCanonicalUrl(`/post/${post.id}`).toString(),
    inLanguage: "zh-CN",
    keywords: [post.category, post.location].filter(Boolean),
    author: {
      "@type": "Person",
      name: post.author.displayName,
      url: getCanonicalUrl(`/u/${post.author.handle}`).toString(),
      image: absoluteUrl(post.author.avatarUrl),
    },
    interactionStatistic: [
      {
        "@type": "InteractionCounter",
        interactionType: "https://schema.org/LikeAction",
        userInteractionCount: post.likesCount,
      },
      {
        "@type": "InteractionCounter",
        interactionType: "https://schema.org/CommentAction",
        userInteractionCount: post.commentsCount,
      },
      {
        "@type": "InteractionCounter",
        interactionType: "https://schema.org/ViewAction",
        userInteractionCount: post.viewsCount,
      },
    ],
    contentLocation: post.location
      ? {
          "@type": "Place",
          name: post.location,
        }
      : undefined,
  };
}
