"use client";

import NextImage from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { initials } from "@/lib/format";

type AvatarProps = {
  src?: string | null;
  name: string;
  size?: "sm" | "md" | "lg";
};

const sizes = {
  sm: "h-9 w-9 text-xs",
  md: "h-12 w-12 text-sm",
  lg: "h-20 w-20 text-3xl",
};

const IMAGE_LOAD_TIMEOUT_MS = 10000;

export function Avatar({ src, name, size = "md" }: AvatarProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const timeoutRef = useRef<number | null>(null);

  const clearImageTimeout = useCallback(() => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    clearImageTimeout();

    if (!src || failedSrc === src) {
      return clearImageTimeout;
    }

    timeoutRef.current = window.setTimeout(() => {
      timeoutRef.current = null;
      setFailedSrc(src);
    }, IMAGE_LOAD_TIMEOUT_MS);

    return clearImageTimeout;
  }, [clearImageTimeout, failedSrc, src]);

  const imageSrc = src && failedSrc !== src ? src : null;

  return (
    <div
      className={`${sizes[size]} relative shrink-0 overflow-hidden rounded-full border border-black/10 bg-gradient-to-br from-orange-100 via-orange-500 to-amber-600 text-white`}
    >
      {imageSrc ? (
        <NextImage
          key={imageSrc}
          src={imageSrc}
          alt={`${name} 的头像`}
          fill
          sizes="96px"
          className="object-cover"
          onLoad={() => {
            clearImageTimeout();
          }}
          onError={() => {
            clearImageTimeout();
            setFailedSrc(imageSrc);
          }}
        />
      ) : (
        <span className="flex h-full w-full items-center justify-center font-semibold">
          {initials(name)}
        </span>
      )}
    </div>
  );
}
