import { notFound } from "next/navigation";
import { CommentsSection } from "@/components/comments-section";
import { PostCard } from "@/components/post-card";
import { ProfileSummaryCard } from "@/components/profile-summary-card";
import { DesktopNav, MobileNav, SiteHeader } from "@/components/site-shell";
import { getCurrentUserProfile, getPostById, getPostComments } from "@/lib/data";
import { sampleProfile } from "@/lib/sample-data";

export const dynamic = "force-dynamic";

export default async function PostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
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
