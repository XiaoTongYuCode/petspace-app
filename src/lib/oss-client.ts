"use client";

import type { OssStsResponse } from "@/lib/oss";

export async function uploadImageToOss(
  file: File,
  purpose: "post" | "avatar" | "cover",
) {
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

  try {
    await client.put(token.objectKey, file);
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

    if (!verifyResponse.ok || !verifyBody?.exists) {
      throw error;
    }

    return {
      url: verifyBody.url ?? token.publicUrl,
      objectKey: verifyBody.objectKey ?? token.objectKey,
    };
  }

  return {
    url: token.publicUrl,
    objectKey: token.objectKey,
  };
}
