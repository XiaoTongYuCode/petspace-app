"use client";

import type { OssStsResponse } from "./oss";

type UploadImageOptions = {
  maxRetries?: number;
  onProgress?: (percent: number) => void;
  onRetry?: (attempt: number, error: unknown) => void;
};

export async function uploadImageToOss(
  file: File,
  purpose: "post" | "avatar" | "cover",
  options: UploadImageOptions = {},
) {
  const { maxRetries = 2, onProgress, onRetry } = options;

  if (!file.type.startsWith("image/")) {
    throw new Error("请选择图片文件。");
  }

  if (file.size > 8 * 1024 * 1024) {
    throw new Error("图片不能超过 8MB。");
  }

  const tokenResponse = await fetch("/api/oss/sts", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      purpose,
      filename: file.name,
      contentType: file.type,
    }),
  });

  if (!tokenResponse.ok) {
    const body = (await tokenResponse.json().catch(() => null)) as
      | { error?: string }
      | null;
    throw new Error(body?.error ?? "获取上传凭证失败。");
  }

  const token = (await tokenResponse.json()) as OssStsResponse;
  const mod = await import("ali-oss/dist/aliyun-oss-sdk.min.js");
  const OSS = mod.default;
  const client = new OSS({
    region: token.region,
    endpoint: token.endpoint,
    bucket: token.bucket,
    accessKeyId: token.credentials.accessKeyId,
    accessKeySecret: token.credentials.accessKeySecret,
    stsToken: token.credentials.stsToken,
    secure: true,
  });

  const maxAttempts = Math.max(1, maxRetries + 1);

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      // Small images do not need multipart upload. Using a single PUT avoids
      // the extra `POST ?uploads=` initialization request that can fail in the browser.
      onProgress?.(10);
      await client.put(token.objectKey, file, {
        mime: file.type,
      });

      onProgress?.(100);

      return {
        url: token.publicUrl,
        objectKey: token.objectKey,
      };
    } catch (error) {
      const verifyResponse = await fetch("/api/oss/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          purpose,
          objectKey: token.objectKey,
        }),
      });
      const verifyBody = (await verifyResponse.json().catch(() => null)) as
        | { exists?: boolean; url?: string; objectKey?: string }
        | null;

      if (verifyResponse.ok && verifyBody?.exists) {
        onProgress?.(100);
        return {
          url: verifyBody.url ?? token.publicUrl,
          objectKey: verifyBody.objectKey ?? token.objectKey,
        };
      }

      if (attempt >= maxAttempts) {
        throw error;
      }

      onRetry?.(attempt, error);
      await new Promise((resolve) => {
        setTimeout(resolve, 350 * attempt);
      });
    }
  }

  throw new Error("上传失败。");
}
