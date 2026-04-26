import {
  Bookmark,
  Compass,
  Home,
  ImagePlus,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { AuthActions } from "@/components/auth-actions";
import { Logo } from "@/components/logo";

const navItems = [
  { href: "/", label: "广场", icon: Home },
  { href: "/compose", label: "发布动态", icon: ImagePlus },
  { href: "/u/petspace", label: "发现", icon: Compass },
  { href: "/me", label: "个人首页", icon: UserRound },
  { href: "/me", label: "收藏", icon: Bookmark },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-black/10 bg-[#fef5e7]/88 backdrop-blur-xl">
      <div className="mx-auto flex h-[60px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Logo />
        <AuthActions />
      </div>
    </header>
  );
}

export function DesktopNav() {
  return (
    <nav className="sticky top-[84px] hidden h-fit rounded-lg bg-white/55 p-1.5 ring-1 ring-black/10 lg:block">
      {navItems.map((item) => {
        const Icon = item.icon;

        return (
          <Link
            key={`${item.href}-${item.label}`}
            href={item.href}
            className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold text-[#5a493b] transition hover:bg-[#fffaf1] hover:text-[#17120d]"
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
    <nav className="fixed bottom-[calc(env(safe-area-inset-bottom)+1rem)] left-1/2 z-50 grid w-[calc(100%-2rem)] max-w-md -translate-x-1/2 grid-cols-5 rounded-full bg-[#17120d] p-1.5 text-[#fff7ea] shadow-2xl shadow-black/20 lg:hidden">
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
