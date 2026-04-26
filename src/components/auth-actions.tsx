"use client";

import { SignInButton, SignUpButton, UserButton, useUser } from "@clerk/nextjs";

export function AuthActions() {
  const { isLoaded, isSignedIn } = useUser();

  if (!isLoaded) {
    return <div className="h-9 w-9" />;
  }

  return (
    <div className="flex items-center gap-2">
      {isSignedIn ? (
        <UserButton />
      ) : (
        <>
          <SignInButton mode="modal">
            <button className="inline-flex h-9 items-center justify-center rounded-full bg-[#17120d] px-4 text-sm font-semibold text-[#fff7ea] transition hover:bg-[#2a2119]">
              登录
            </button>
          </SignInButton>
          <SignUpButton mode="modal">
            <button className="hidden h-9 items-center justify-center rounded-full bg-white/70 px-4 text-sm font-semibold text-[#17120d] ring-1 ring-black/10 transition hover:bg-white sm:inline-flex">
              注册
            </button>
          </SignUpButton>
        </>
      )}
    </div>
  );
}
