import { BackendStatusPanel } from "@/components/backend-status-panel";
import { PostCard } from "@/components/post-card";
import { ProfileEditor } from "@/components/profile-editor";
import { DesktopNav, MobileNav, SiteHeader } from "@/components/site-shell";
import { getBackendStatus } from "@/lib/backend-status";
import { getCurrentUserProfile, getPostsByAuthorId } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function MePage() {
  const [backendStatus, profile] = await Promise.all([
    getBackendStatus({ checkDatabase: true }),
    getCurrentUserProfile(),
  ]);
  const posts = profile ? await getPostsByAuthorId(profile.id) : [];

  return (
    <div className="min-h-screen bg-[#fef5e7] pb-32 lg:pb-8">
      <SiteHeader />
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-5 px-4 py-5 sm:gap-6 sm:px-6 sm:py-6 lg:grid-cols-[210px_minmax(0,1fr)] lg:px-8 lg:py-8">
        <DesktopNav />
        <main className="min-w-0 space-y-5">
          <BackendStatusPanel status={backendStatus} />
          <ProfileEditor profile={profile} />
          {posts.length > 0 ? (
            <section className="space-y-5">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </section>
          ) : null}
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
