"use client";

import { SignUpButton, UserButton, useUser } from "@clerk/nextjs";

export function AuthActions() {
  const { isLoaded, isSignedIn } = useUser();

  if (!isLoaded) {
    return <div className="h-9 w-9" />;
  }

  return (
    <div className="flex items-center">
      {isSignedIn ? (
        <UserButton />
      ) : (
        <SignUpButton mode="modal">
          <button
            data-testid="header-login-button"
            className="inline-flex h-9 items-center justify-center rounded-full bg-[#17120d] px-5 text-sm font-semibold text-[#fff7ea] shadow-sm transition hover:bg-[#2a2119] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e46645]/40"
          >
            登录
          </button>
        </SignUpButton>
      )}
    </div>
  );
}
