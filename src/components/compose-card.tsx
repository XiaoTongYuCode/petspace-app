"use client";

import { ImagePlus, Loader2, MapPin, Save, Send, X } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useRef, useState } from "react";
import { uploadImageToOss } from "@/lib/oss-client";

type ComposeCardProps = {
  disabledReason?: string | null;
};

type ComposeDraft = {
  id: string;
  caption: string;
  location: string;
  updatedAt: string;
};

const DRAFTS_STORAGE_KEY = "petspace-compose-drafts-v1";
const MAX_DRAFTS = 8;

function getStoredDrafts(): ComposeDraft[] {
  if (typeof window === "undefined") {
    return [];
  }
  try {
    const saved = window.localStorage.getItem(DRAFTS_STORAGE_KEY);
    if (!saved) {
      return [];
    }
    const parsed = JSON.parse(saved) as ComposeDraft[];
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.slice(0, MAX_DRAFTS);
  } catch {
    return [];
  }
}

export function ComposeCard({ disabledReason = null }: ComposeCardProps) {
  const router = useRouter();
  const isDisabled = Boolean(disabledReason);
  const [drafts, setDrafts] = useState<ComposeDraft[]>(() => getStoredDrafts());
  const [caption, setCaption] = useState(() => getStoredDrafts()[0]?.caption ?? "");
  const [location, setLocation] = useState(() => getStoredDrafts()[0]?.location ?? "");
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

  function saveDraftSnapshot() {
    if (typeof window === "undefined") {
      return;
    }
    if (!caption.trim() && !location.trim()) {
      return;
    }
    const nextDraft: ComposeDraft = {
      id: crypto.randomUUID(),
      caption: caption.trim(),
      location: location.trim(),
      updatedAt: new Date().toISOString(),
    };
    const nextDrafts = [nextDraft, ...drafts].slice(0, MAX_DRAFTS);
    setDrafts(nextDrafts);
    window.localStorage.setItem(DRAFTS_STORAGE_KEY, JSON.stringify(nextDrafts));
    setSuccess("草稿已保存。");
  }

  function applyDraft(draft: ComposeDraft) {
    setCaption(draft.caption);
    setLocation(draft.location);
    setSuccess("已载入草稿。");
  }

  function removeDraft(draftId: string) {
    if (typeof window === "undefined") {
      return;
    }
    const nextDrafts = drafts.filter((draft) => draft.id !== draftId);
    setDrafts(nextDrafts);
    window.localStorage.setItem(DRAFTS_STORAGE_KEY, JSON.stringify(nextDrafts));
  }

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    autoSaveTimeoutRef.current = setTimeout(() => {
      if (!caption.trim() && !location.trim()) {
        return;
      }
      setDrafts((currentDrafts) => {
        const currentAutoDraft: ComposeDraft = {
          id: "autosave",
          caption: caption.trim(),
          location: location.trim(),
          updatedAt: new Date().toISOString(),
        };
        const withoutAutosave = currentDrafts.filter(
          (draft) => draft.id !== "autosave",
        );
        const nextDrafts = [currentAutoDraft, ...withoutAutosave].slice(0, MAX_DRAFTS);
        window.localStorage.setItem(DRAFTS_STORAGE_KEY, JSON.stringify(nextDrafts));
        return nextDrafts;
      });
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
      removeDraft("autosave");
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
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2 rounded-md border border-[#f0dbc1] bg-[#fff8ed] px-3 py-2 text-xs text-[#6b5747]">
        <span className="font-semibold">草稿箱：{drafts.length} 条（自动保存已开启）</span>
        <div className="inline-flex items-center gap-2">
          <button
            type="button"
            onClick={saveDraftSnapshot}
            disabled={isDisabled}
            className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 font-semibold transition hover:bg-[#fff2dd] disabled:opacity-60"
          >
            <Save className="h-3.5 w-3.5" />
            保存草稿
          </button>
          {drafts[0] ? (
            <button
              type="button"
              onClick={() => applyDraft(drafts[0])}
              className="rounded-full bg-white px-2.5 py-1 font-semibold transition hover:bg-[#fff2dd]"
            >
              恢复最近草稿
            </button>
          ) : null}
        </div>
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

      <div className="mt-2 flex flex-wrap gap-2">
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
