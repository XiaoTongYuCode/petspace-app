"use client";

import { ImagePlus, Loader2, MapPin, Send, X } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useRef, useState } from "react";
import { uploadImageToOss } from "@/lib/oss-client";

type ComposeCardProps = {
  disabledReason?: string | null;
};

export function ComposeCard({ disabledReason = null }: ComposeCardProps) {
  const router = useRouter();
  const isDisabled = Boolean(disabledReason);
  const [caption, setCaption] = useState("");
  const [location, setLocation] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const previewUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, []);

  function updateFile(nextFile: File | null) {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }

    setFile(nextFile);

    if (!nextFile) {
      setPreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(nextFile);
    previewUrlRef.current = objectUrl;
    setPreviewUrl(objectUrl);
  }

  async function submitPost(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (disabledReason) {
      setError(disabledReason);
      return;
    }

    if (!caption.trim()) {
      setError("写一点宠物今天的生活吧。");
      return;
    }

    if (!file) {
      setError("请选择一张图片。");
      return;
    }

    setIsSubmitting(true);

    try {
      const upload = await uploadImageToOss(file, "post");
      const response = await fetch("/api/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          caption,
          location: location || null,
          imageUrl: upload.url,
          imageObjectKey: upload.objectKey,
          category: "daily",
        }),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(body?.error ?? "发布失败。");
      }

      setCaption("");
      setLocation("");
      updateFile(null);
      setSuccess("动态已发布。");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "发布失败。");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={submitPost}
      data-testid="compose-card"
      className="rounded-lg bg-white/70 p-3 shadow-sm ring-1 ring-black/10 sm:p-4"
    >
      <div>
        <label htmlFor="caption" className="sr-only">
          发布动态
        </label>
        <textarea
          id="caption"
          value={caption}
          onChange={(event) => setCaption(event.target.value)}
          disabled={isDisabled}
          maxLength={500}
          rows={2}
          placeholder="分享今日宠物生活..."
          className="min-h-16 w-full resize-none border-0 bg-transparent px-1 py-1 text-base leading-6 text-[#17120d] outline-none placeholder:text-[#9a826d]"
        />
      </div>

      {previewUrl ? (
        <div className="relative mt-3 overflow-hidden rounded-md bg-[#f5dfbd]">
          <Image
            src={previewUrl}
            alt="待发布图片预览"
            width={1000}
            height={680}
            className="max-h-[420px] w-full object-cover"
            unoptimized
          />
          <button
            type="button"
            onClick={() => updateFile(null)}
            className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/70 text-white transition hover:bg-black"
            aria-label="移除图片"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : null}

      <div className="mt-3 flex flex-col gap-3 border-t border-black/10 pt-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-full bg-[#fffaf1] px-3 text-sm font-semibold text-[#5a493b] ring-1 ring-black/10 transition hover:bg-white">
            <ImagePlus className="h-4 w-4" />
            图片
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              disabled={isDisabled}
              className="sr-only"
              onChange={(event) => updateFile(event.target.files?.[0] ?? null)}
            />
          </label>
          <label className="inline-flex h-9 items-center gap-2 rounded-full bg-[#fffaf1] px-3 text-sm font-semibold text-[#5a493b] ring-1 ring-black/10">
            <MapPin className="h-4 w-4" />
            <input
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              disabled={isDisabled}
              maxLength={80}
              placeholder="地点"
              className="w-24 bg-transparent outline-none placeholder:text-[#9a826d]"
            />
          </label>
        </div>
        <button
          type="submit"
          disabled={isSubmitting || isDisabled}
          className="inline-flex h-9 items-center justify-center gap-2 rounded-full bg-[#e46645] px-4 text-sm font-bold text-white transition hover:bg-[#d3583b] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          发布动态
        </button>
      </div>

      {disabledReason ? (
        <p className="mt-3 text-sm font-medium text-[#8a5b2c]">{disabledReason}</p>
      ) : null}
      {error ? <p className="mt-3 text-sm font-medium text-[#b23b2b]">{error}</p> : null}
      {success ? (
        <p className="mt-3 text-sm font-medium text-[#617d48]">{success}</p>
      ) : null}
    </form>
  );
}
