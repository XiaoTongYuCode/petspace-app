"use client";

import { ImagePlus, Loader2, MapPin, Send, X } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useRef, useState } from "react";
import { uploadImageToOss } from "@/lib/oss-client";

type ComposeCardProps = {
  disabledReason?: string | null;
};

type ComposeAutosave = {
  caption: string;
  location: string;
};

const DRAFT_STORAGE_KEY = "petspace-compose-autosave-v2";

function getStoredAutosave(): ComposeAutosave | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const saved = window.localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!saved) {
      return null;
    }
    const parsed = JSON.parse(saved) as Partial<ComposeAutosave>;
    if (typeof parsed !== "object" || parsed === null) {
      return null;
    }
    return {
      caption: typeof parsed.caption === "string" ? parsed.caption : "",
      location: typeof parsed.location === "string" ? parsed.location : "",
    };
  } catch {
    return null;
  }
}

export function ComposeCard({ disabledReason = null }: ComposeCardProps) {
  const router = useRouter();
  const isDisabled = Boolean(disabledReason);
  const [caption, setCaption] = useState(() => getStoredAutosave()?.caption ?? "");
  const [location, setLocation] = useState(() => getStoredAutosave()?.location ?? "");
  const [challengeTag, setChallengeTag] = useState("#今日宠物微笑");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadRetryCount, setUploadRetryCount] = useState(0);
  const previewUrlRef = useRef<string | null>(null);
  const autoSaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    autoSaveTimeoutRef.current = setTimeout(() => {
      if (!caption.trim() && !location.trim()) {
        window.localStorage.removeItem(DRAFT_STORAGE_KEY);
        return;
      }
      const autosaveData: ComposeAutosave = {
        caption: caption.trim(),
        location: location.trim(),
      };
      window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(autosaveData));
    }, 800);

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [caption, location]);

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

  function requestBrowserLocation() {
    if (isDisabled || isLocating) {
      return;
    }

    setError(null);

    if (!("geolocation" in navigator)) {
      setError("当前浏览器不支持定位。");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setLocation(
          `当前位置 ${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`,
        );
        setIsLocating(false);
      },
      (positionError) => {
        setIsLocating(false);

        if (positionError.code === positionError.PERMISSION_DENIED) {
          setError("需要允许浏览器定位权限后才能获取位置。");
          return;
        }

        setError(
          positionError.code === positionError.TIMEOUT
            ? "定位超时，请稍后再试。"
            : "暂时无法获取定位。",
        );
      },
      { enableHighAccuracy: true, maximumAge: 60000, timeout: 10000 },
    );
  }

  async function submitPost(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await publishPost();
  }

  async function publishPost() {
    setError(null);
    setSuccess(null);
    setUploadProgress(0);
    setUploadRetryCount(0);

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
      const upload = await uploadImageToOss(file, "post", {
        onProgress(percent) {
          setUploadProgress(percent);
        },
        onRetry(attempt) {
          setUploadRetryCount(attempt);
        },
      });
      const response = await fetch("/api/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          caption: `${caption.trim()} ${challengeTag}`.trim(),
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
      setChallengeTag("#今日宠物微笑");
      updateFile(null);
      setUploadProgress(0);
      setSuccess("动态已发布。");
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(DRAFT_STORAGE_KEY);
      }
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
      className="rounded-lg bg-white/82 p-3 shadow-sm ring-1 ring-black/10 transition focus-within:shadow-md focus-within:ring-[#e46645]/25 sm:p-4"
      style={{ paddingBottom: "10px" }}
    >
      <div className="mb-2 flex flex-wrap gap-2">
        {["#今日宠物微笑", "#遛弯地图", "#本周萌宠挑战"].map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => setChallengeTag(tag)}
            className={`rounded-full px-2.5 py-1 text-xs font-semibold transition ${
              challengeTag === tag
                ? "bg-[#f2b84b] text-[#4f3a0f]"
                : "bg-[#fff3df] text-[#8f6a22] hover:bg-[#ffe7bf]"
            }`}
          >
            {tag}
          </button>
        ))}
      </div>

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
          placeholder="今天你的小家伙在干嘛？"
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

      <div className="mt-3 flex flex-col gap-3 pt-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex w-fit flex-wrap items-center gap-2 rounded-full">
          <label className="inline-flex h-9 min-w-9 cursor-pointer items-center justify-center rounded-full text-[#5a493b] transition hover:bg-white focus-within:bg-white focus-within:ring-2 focus-within:ring-[#e46645]/25">
            <ImagePlus className="h-5 w-5" />
            <span className="sr-only">选择图片</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              disabled={isDisabled}
              className="sr-only"
              onChange={(event) => updateFile(event.target.files?.[0] ?? null)}
            />
          </label>
          <button
            type="button"
            onClick={requestBrowserLocation}
            disabled={isDisabled || isLocating}
            data-testid="location-button"
            aria-label={location ? `已获取定位：${location}` : "获取当前位置"}
            title={location ? `已获取定位：${location}` : "获取当前位置"}
            className={`inline-flex h-9 min-w-9 items-center justify-center rounded-full transition disabled:cursor-not-allowed disabled:opacity-50 ${
              location && !isLocating
                ? "gap-1.5 text-[#c44f35]"
                : "text-[#5a493b] hover:bg-white"
            }`}
          >
            {isLocating ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <MapPin className="h-5 w-5" />
            )}
            {location && !isLocating ? (
              <span data-testid="location-label" className="text-xs font-bold">
                定位
              </span>
            ) : null}
          </button>
        </div>
        <button
          type="submit"
          disabled={isSubmitting || isDisabled}
          className="inline-flex h-8 items-center justify-center gap-2 rounded-full bg-[#e46645] px-4 text-sm font-bold text-white transition hover:bg-[#d3583b] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          发布
        </button>
      </div>

      {isSubmitting ? (
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs font-semibold text-[#7f654d]">
            <span>上传进度</span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-[#f0e1cb]">
            <div
              className="h-full rounded-full bg-[#e46645] transition-all"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          {uploadRetryCount > 0 ? (
            <p className="mt-1 text-xs text-[#9a603f]">上传重试中（第 {uploadRetryCount} 次）…</p>
          ) : null}
        </div>
      ) : null}

      {disabledReason ? (
        <p className="mt-3 text-sm font-medium text-[#8a5b2c]">{disabledReason}</p>
      ) : null}
      {error ? <p className="mt-3 text-sm font-medium text-[#b23b2b]">{error}</p> : null}
      {error && file && !isSubmitting ? (
        <button
          type="button"
          onClick={publishPost}
          className="mt-2 rounded-full bg-[#17120d] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#2f251c]"
        >
          重试发布
        </button>
      ) : null}
      {success ? (
        <p className="mt-3 text-sm font-medium text-[#617d48]">{success}</p>
      ) : null}
    </form>
  );
}
