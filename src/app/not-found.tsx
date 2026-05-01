import Link from "next/link";
import { buildPageMetadata } from "@/lib/seo";

export const metadata = buildPageMetadata({
  title: "没有找到内容",
  description: "这条 Petspace 动态或用户主页不存在，返回宠物广场继续浏览宠物日常。",
  path: "/404",
  image: "/brand/petspace-logo.png",
  noIndex: true,
});

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#fef5e7] px-4">
      <section className="max-w-md rounded-lg bg-white/75 p-8 text-center ring-1 ring-black/10">
        <p className="text-sm font-bold text-[#e46645]">Petspace</p>
        <h1 className="mt-3 text-3xl font-black text-[#17120d]">没有找到内容</h1>
        <p className="mt-3 text-sm leading-6 text-[#5a493b]">
          这条动态或主页可能已经离开当前空间。
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex h-10 items-center rounded-full bg-[#17120d] px-4 text-sm font-bold text-[#fff7ea]"
        >
          回到广场
        </Link>
      </section>
    </main>
  );
}
