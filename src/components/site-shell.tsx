import type { ReactNode } from "react";
import { Bookmark, Compass, Home, ImagePlus, UserRound } from "lucide-react";
import Link from "next/link";
import { AuthActions } from "@/components/auth-actions";
import { Logo } from "@/components/logo";

const navItems = [
  { href: "/", label: "宠物广场", icon: Home },
  { href: "/compose", label: "发布动态", icon: ImagePlus },
  { href: "/u/petspace", label: "发现", icon: Compass },
  { href: "/me", label: "我的", icon: UserRound },
  { href: "/favorites", label: "收藏", icon: Bookmark },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 flex items-center h-[50px] border-b border-black/10 bg-[#fef5e7]/92 backdrop-blur-xl">
      <div className="mx-auto flex h-[40px] w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Logo />
        <AuthActions />
      </div>
    </header>
  );
}

type DesktopNavProps = {
  sticky?: boolean;
};

export function DesktopSidebar({ children }: { children?: ReactNode }) {
  return (
    <aside className="sticky top-[84px] hidden h-fit space-y-4 lg:block">
      <DesktopNav sticky={false} />
      {children}
    </aside>
  );
}

export function DesktopNav({ sticky = true }: DesktopNavProps) {
  return (
    <nav
      className={`hidden h-fit rounded-xl bg-white/70 p-1.5 shadow-sm ring-1 ring-black/10 lg:block ${
        sticky ? "sticky top-[84px]" : ""
      }`}
    >
      {navItems.map((item) => {
        const Icon = item.icon;

        return (
          <Link
            key={`${item.href}-${item.label}`}
            href={item.href}
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-[#5a493b] transition hover:bg-[#fffaf1] hover:text-[#17120d]"
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function MobileNav() {
  return (
    <nav className="fixed bottom-[calc(env(safe-area-inset-bottom)+0.85rem)] left-1/2 z-50 grid w-[calc(100%-2rem)] max-w-md -translate-x-1/2 grid-cols-5 rounded-full border border-white/10 bg-[#17120d]/94 p-1.5 text-[#fff7ea] shadow-2xl shadow-black/20 backdrop-blur lg:hidden">
      {navItems.map((item) => {
        const Icon = item.icon;

        return (
          <Link
            key={`${item.href}-${item.label}-mobile`}
            href={item.href}
            className="flex min-h-10 items-center justify-center rounded-full transition hover:bg-white/10"
            aria-label={item.label}
          >
            <Icon className="h-5 w-5" />
          </Link>
        );
      })}
    </nav>
  );
}
