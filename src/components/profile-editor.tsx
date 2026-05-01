"use client";

import { SignInButton } from "@clerk/nextjs";
import { Camera, Loader2, Save } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Avatar } from "@/components/avatar";
import { uploadImageToOss } from "@/lib/oss-client";
import { DEFAULT_PROFILE_COVER_URL } from "@/lib/profile-defaults";
import type { ProfileSummary } from "@/lib/types";

type ProfileEditorProps = {
  profile: ProfileSummary | null;
};

type ProfilePatch = {
  displayName?: string;
  handle?: string;
  bio?: string;
  coverUrl?: string | null;
  coverObjectKey?: string | null;
};

async function updateProfile(patch: ProfilePatch) {
  const response = await fetch("/api/me/profile", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(patch),
  });
  const body = (await response.json().catch(() => null)) as
    | { error?: string; coverUrl?: string | null; coverObjectKey?: string | null }
    | null;

  if (!response.ok) {
    throw new Error(body?.error ?? "保存失败。");
  }

  return body;
}

export function ProfileEditor({ profile }: ProfileEditorProps) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(profile?.displayName ?? "");
  const [handle, setHandle] = useState(profile?.handle ?? "");
  const [bio, setBio] = useState(profile?.bio ?? "");
  const [coverUrl, setCoverUrl] = useState<string | null>(profile?.coverUrl ?? null);
  const [coverObjectKey, setCoverObjectKey] = useState<string | null>(
    profile?.coverObjectKey ?? null,
  );
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [uploading, setUploading] = useState<"cover" | null>(null);
  const displayedCoverUrl = coverUrl ?? DEFAULT_PROFILE_COVER_URL;

  async function uploadProfileCover(file: File) {
    setError(null);
    setSuccess(null);
    setUploading("cover");
    const previousCoverUrl = coverUrl;
    const previousCoverObjectKey = coverObjectKey;

    try {
      const result = await uploadImageToOss(file, "cover");

      setCoverUrl(result.url);
      setCoverObjectKey(result.objectKey);
      const updated = await updateProfile({
        coverUrl: result.url,
        coverObjectKey: result.objectKey,
      });

      setCoverUrl(updated?.coverUrl ?? result.url);
      setCoverObjectKey(updated?.coverObjectKey ?? result.objectKey);
      setSuccess("背景图已更新。");
      router.refresh();
    } catch (caught) {
      setCoverUrl(previousCoverUrl);
      setCoverObjectKey(previousCoverObjectKey);
      setError(caught instanceof Error ? caught.message : "上传失败。");
    } finally {
      setUploading(null);
    }
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSaving(true);

    try {
      await updateProfile({
        displayName,
        handle,
        bio,
        coverUrl,
        coverObjectKey,
      });

      setSuccess("主页已更新。");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "保存失败。");
    } finally {
      setIsSaving(false);
    }
  }

  if (!profile) {
    return (
      <section
        data-testid="signed-out-profile-card"
        className="rounded-lg bg-white/76 px-5 py-10 text-center shadow-sm ring-1 ring-black/10 sm:px-8 sm:py-12"
      >
        <div className="mx-auto max-w-xl">
          <p className="text-sm font-bold text-[#d75d3f]">我的主页</p>
          <h1 className="mt-3 text-2xl font-black text-[#17120d] sm:text-3xl">
            登录后整理你的宠物主页
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-sm leading-7 text-[#5a493b]">
            添加背景图、简介和昵称，把你与宠物的日常集中展示给大家。
          </p>
          <SignInButton mode="modal">
            <button
              data-testid="profile-login-button"
              className="mt-7 inline-flex h-10 items-center justify-center rounded-full bg-[#17120d] px-7 text-sm font-bold text-[#fff7ea] shadow-sm transition hover:bg-[#2a2119] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e46645]/40"
            >
              登录
            </button>
          </SignInButton>
        </div>
      </section>
    );
  }

  return (
    <form onSubmit={saveProfile} className="overflow-hidden rounded-lg bg-white/72 ring-1 ring-black/10">
      <div className="relative h-52 bg-[#e8c893]">
        <Image
          src={displayedCoverUrl}
          alt="主页背景图"
          fill
          sizes="900px"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-white/80 via-white/25 to-transparent" />
        <label className="absolute bottom-4 right-4 z-10 inline-flex h-8 cursor-pointer items-center gap-2 rounded-full bg-black/70 px-2 text-sm font-semibold text-white backdrop-blur transition hover:bg-black">
          {uploading === "cover" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Camera className="h-4 w-4" />
          )}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void uploadProfileCover(file);
            }}
          />
        </label>
      </div>

      <div className="p-5">
        <div className="pointer-events-none relative z-10 -mt-16 flex items-end gap-4">
          <Avatar src={profile.avatarUrl} name={displayName || profile.displayName} size="lg" />
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="space-y-2 text-sm font-semibold text-[#5a493b]">
            昵称
            <input
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              maxLength={80}
              className="h-11 w-full rounded-md bg-[#fffaf1] px-3.5 text-[#17120d] outline-none ring-1 ring-black/10 focus:ring-2 focus:ring-[#e46645]"
            />
          </label>
          <label className="space-y-2 text-sm font-semibold text-[#5a493b]">
            用户名
            <input
              value={handle}
              onChange={(event) => setHandle(event.target.value)}
              maxLength={32}
              className="h-11 w-full rounded-md bg-[#fffaf1] px-3.5 text-[#17120d] outline-none ring-1 ring-black/10 focus:ring-2 focus:ring-[#e46645]"
            />
          </label>
        </div>

        <label className="mt-4 block space-y-2 text-sm font-semibold text-[#5a493b]">
          简介
          <textarea
            value={bio}
            onChange={(event) => setBio(event.target.value)}
            maxLength={240}
            rows={4}
            className="w-full resize-none rounded-md bg-[#fffaf1] px-4 py-3 text-[#17120d] outline-none ring-1 ring-black/10 focus:ring-2 focus:ring-[#e46645]"
          />
        </label>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            {error ? (
              <p className="text-sm font-medium text-[#b23b2b]">{error}</p>
            ) : null}
            {success ? (
              <p className="text-sm font-medium text-[#617d48]">{success}</p>
            ) : null}
          </div>
          <button
            type="submit"
            disabled={isSaving || Boolean(uploading)}
            className="inline-flex h-8 items-center justify-center gap-2 rounded-full bg-[#e46645] px-4 text-sm font-bold text-white transition hover:bg-[#d3583b] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            保存
          </button>
        </div>
      </div>
    </form>
  );
}
