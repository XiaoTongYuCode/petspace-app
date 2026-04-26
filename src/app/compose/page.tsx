import { BackendStatusPanel } from "@/components/backend-status-panel";
import { ComposeCard } from "@/components/compose-card";
import { DesktopNav, MobileNav, SiteHeader } from "@/components/site-shell";
import { getBackendStatus } from "@/lib/backend-status";

export const dynamic = "force-dynamic";

export default async function ComposePage() {
  const backendStatus = await getBackendStatus({ checkDatabase: true });
  const composeDisabledReason = backendStatus.ready
    ? null
    : "发布功能暂时还在准备中，可以先浏览演示动态。";

  return (
    <div className="min-h-screen bg-[#fef5e7] pb-24">
      <SiteHeader />
      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-5 px-4 py-5 sm:px-6 lg:grid-cols-[210px_minmax(0,1fr)] lg:px-8">
        <DesktopNav />
        <main className="min-w-0 space-y-5">
          <section className="rounded-lg bg-[#17120d] p-4 text-[#fff7ea] ring-1 ring-black/10">
            <p className="text-sm font-semibold text-[#f2b84b]">Petspace</p>
            <h1 className="mt-2 text-2xl font-black">发布动态</h1>
          </section>
          <BackendStatusPanel status={backendStatus} />
          <ComposeCard disabledReason={composeDisabledReason} />
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
