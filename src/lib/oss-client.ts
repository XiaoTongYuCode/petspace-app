"use client";

type UploadImageOptions = {
  maxRetries?: number;
  onProgress?: (percent: number) => void;
  onRetry?: (attempt: number, error: unknown) => void;
};

type OssUploadResponse = {
  url: string;
  objectKey: string;
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

  const maxAttempts = Math.max(1, maxRetries + 1);

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const formData = new FormData();
      formData.set("purpose", purpose);
      formData.set("file", file);

      onProgress?.(10);

      const uploadResponse = await fetch("/api/oss/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadResponse.ok) {
        const body = (await uploadResponse.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(body?.error ?? "上传图片失败。");
      }

      const uploaded = (await uploadResponse.json()) as OssUploadResponse;
      onProgress?.(100);

      return uploaded;
    } catch (error) {
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
