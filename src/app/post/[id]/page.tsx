import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CommentsSection } from "@/components/comments-section";
import { PostCard } from "@/components/post-card";
import { ProfileSummaryCard } from "@/components/profile-summary-card";
import { DesktopNav, MobileNav, SiteHeader } from "@/components/site-shell";
import { getCurrentUserProfile, getPostById, getPostComments } from "@/lib/data";
import { sampleProfile } from "@/lib/sample-data";
import {
  JsonLd,
  buildPageMetadata,
  buildPostMetadata,
  postJsonLd,
} from "@/lib/seo";

export const dynamic = "force-dynamic";

type PostPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: PostPageProps): Promise<Metadata> {
  const { id } = await params;
  const post = await getPostById(id);

  if (!post) {
    return buildPageMetadata({
      title: "没有找到动态",
      description: "这条 Petspace 宠物动态不存在或暂时无法访问。",
      path: `/post/${id}`,
      image: "/brand/petspace-logo.png",
      noIndex: true,
    });
  }

  return buildPostMetadata(post);
}

export default async function PostPage({
  params,
}: PostPageProps) {
  const { id } = await params;
  const [post, profile, comments] = await Promise.all([
    getPostById(id),
    getCurrentUserProfile(),
    getPostComments(id),
  ]);

  if (!post) {
    notFound();
  }

  const isSample = post.id.startsWith("sample-");
  const commentDisabledReason = isSample
    ? "演示动态暂不支持评论。"
    : null;

  return (
    <div className="min-h-screen bg-[#fef5e7] pb-32 lg:pb-8">
      <SiteHeader />
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-5 px-4 py-5 sm:gap-6 sm:px-6 sm:py-6 lg:grid-cols-[210px_minmax(0,1fr)] lg:px-8 lg:py-8 xl:grid-cols-[210px_minmax(0,680px)_320px]">
        <DesktopNav />
        <main className="min-w-0 space-y-5">
          <JsonLd data={postJsonLd(post)} />
          <PostCard post={post} priority />
          <CommentsSection
            key={`${post.id}-${post.commentsCount}`}
            postId={post.id}
            initialComments={comments}
            canComment={!isSample && Boolean(profile)}
            disabledReason={commentDisabledReason}
          />
        </main>
        <ProfileSummaryCard
          profile={profile ?? sampleProfile}
          editable={Boolean(profile)}
        />
      </div>
      <MobileNav />
    </div>
  );
}
