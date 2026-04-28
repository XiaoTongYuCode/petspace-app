import { Logo } from "@/components/logo";

function LoadingPostCard() {
  return (
    <article className="overflow-hidden rounded-xl bg-white/78 shadow-[0_14px_28px_-24px_rgba(23,18,13,0.85)] ring-1 ring-black/10">
      <div className="flex items-center gap-3 p-4 sm:p-5">
        <div className="h-11 w-11 animate-pulse rounded-full bg-[#ecd8ba]" />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="h-4 w-32 animate-pulse rounded bg-[#ecd8ba]" />
          <div className="h-3 w-44 animate-pulse rounded bg-[#f2e2cc]" />
        </div>
      </div>
      <div className="px-4 pb-4 sm:px-5">
        <div className="h-4 w-3/4 animate-pulse rounded bg-[#f2e2cc]" />
        <div className="mt-2 h-4 w-1/2 animate-pulse rounded bg-[#f2e2cc]" />
      </div>
      <div className="aspect-[16/10] max-h-[420px] w-full animate-pulse bg-[#efd7b5]" />
      <div className="grid grid-cols-4 border-t border-black/10 p-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div
            key={index}
            className="mx-auto h-4 w-10 animate-pulse rounded bg-[#ecd8ba]"
          />
        ))}
      </div>
    </article>
  );
}

export default function Loading() {
  return (
    <div className="min-h-screen bg-[#fef5e7] pb-32 lg:pb-8">
      <header className="sticky top-0 z-40 flex h-[50px] items-center border-b border-black/10 bg-[#fef5e7]/92 backdrop-blur-xl">
        <div className="mx-auto flex h-[40px] w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Logo />
          <div className="h-9 w-16 animate-pulse rounded-full bg-[#17120d]/15" />
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-5 px-4 py-5 sm:gap-6 sm:px-6 sm:py-6 lg:grid-cols-[210px_minmax(0,1fr)] lg:px-8 lg:py-8 xl:grid-cols-[210px_minmax(0,680px)_320px]">
        <aside className="sticky top-[84px] hidden h-fit rounded-xl bg-white/70 p-1.5 shadow-sm ring-1 ring-black/10 lg:block">
          {Array.from({ length: 5 }, (_, index) => (
            <div
              key={index}
              className="m-1.5 h-9 animate-pulse rounded-lg bg-[#f2e2cc]"
            />
          ))}
        </aside>

        <main className="min-w-0 space-y-5" aria-label="页面加载中">
          <section className="rounded-xl border border-black/10 bg-[#17120d] px-4 py-4 shadow-[0_18px_40px_-28px_rgba(0,0,0,0.85)] sm:px-6">
            <div className="h-4 w-20 animate-pulse rounded bg-[#f2b84b]/70" />
            <div className="mt-3 h-8 w-36 animate-pulse rounded bg-[#fff7ea]/25" />
          </section>

          <section className="rounded-lg bg-white/82 p-4 shadow-sm ring-1 ring-black/10">
            <div className="flex gap-2">
              <div className="h-7 w-24 animate-pulse rounded-full bg-[#f0dec4]" />
              <div className="h-7 w-20 animate-pulse rounded-full bg-[#f0dec4]" />
            </div>
            <div className="mt-4 h-16 animate-pulse rounded-md bg-[#f4e4ce]" />
            <div className="mt-4 flex items-center justify-between">
              <div className="h-9 w-24 animate-pulse rounded-full bg-[#f4e4ce]" />
              <div className="h-8 w-20 animate-pulse rounded-full bg-[#e8b49d]" />
            </div>
          </section>

          <LoadingPostCard />
        </main>

        <aside className="hidden h-fit overflow-hidden rounded-lg bg-white/60 ring-1 ring-black/10 xl:block">
          <div className="h-28 animate-pulse bg-[#eecf9d]" />
          <div className="space-y-4 px-5 pb-5 pt-5">
            <div className="h-5 w-36 animate-pulse rounded bg-[#ecd8ba]" />
            <div className="h-4 w-24 animate-pulse rounded bg-[#f2e2cc]" />
            <div className="grid grid-cols-3 gap-2">
              {Array.from({ length: 3 }, (_, index) => (
                <div
                  key={index}
                  className="h-16 animate-pulse rounded-md bg-[#fffaf1] ring-1 ring-black/5"
                />
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
