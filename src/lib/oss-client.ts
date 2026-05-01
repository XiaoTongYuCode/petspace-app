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

const MAX_UPLOAD_IMAGE_BYTES = 4 * 1024 * 1024;
const TARGET_UPLOAD_IMAGE_BYTES = Math.floor(MAX_UPLOAD_IMAGE_BYTES * 0.92);
const MAX_UPLOAD_IMAGE_ERROR_TEXT = "图片不能超过 4MB。";
const COMPRESSION_OUTPUT_TYPES = ["image/webp", "image/jpeg"] as const;
const INITIAL_COMPRESSION_QUALITY = 0.88;
const MIN_COMPRESSION_QUALITY = 0.52;
const COMPRESSION_QUALITY_STEP = 0.08;
const MAX_COMPRESSED_IMAGE_EDGE = 2560;
const MIN_COMPRESSED_IMAGE_EDGE = 640;
const COMPRESSION_RESIZE_STEP = 0.82;

class UploadRequestError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "UploadRequestError";
    this.status = status;
  }
}

function shouldRetryUpload(error: unknown) {
  if (error instanceof UploadRequestError) {
    return error.status >= 500;
  }

  return true;
}

function replaceFileExtension(filename: string, mimeType: string) {
  const extension =
    mimeType === "image/webp" ? "webp" : mimeType === "image/png" ? "png" : "jpg";
  const baseName = filename.replace(/\.[^.]+$/, "") || "image";
  return `${baseName}.${extension}`;
}

function getScaledDimensions(width: number, height: number, maxEdge: number) {
  const longestEdge = Math.max(width, height);

  if (longestEdge <= maxEdge) {
    return { width, height };
  }

  const scale = maxEdge / longestEdge;
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  mimeType: string,
  quality: number,
) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("图片压缩失败。"));
          return;
        }

        resolve(blob);
      },
      mimeType,
      quality,
    );
  });
}

async function loadImage(file: File) {
  const objectUrl = URL.createObjectURL(file);

  try {
    const image = new Image();
    const loaded = new Promise<HTMLImageElement>((resolve, reject) => {
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("图片读取失败。"));
    });

    image.src = objectUrl;
    return await loaded;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

async function renderCompressedImage(
  image: HTMLImageElement,
  filename: string,
  maxEdge: number,
  quality: number,
  mimeType: (typeof COMPRESSION_OUTPUT_TYPES)[number],
) {
  const sourceWidth = image.naturalWidth || image.width;
  const sourceHeight = image.naturalHeight || image.height;
  const dimensions = getScaledDimensions(sourceWidth, sourceHeight, maxEdge);
  const canvas = document.createElement("canvas");
  canvas.width = dimensions.width;
  canvas.height = dimensions.height;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("当前浏览器无法压缩图片。");
  }

  if (mimeType === "image/jpeg") {
    context.fillStyle = "#fff";
    context.fillRect(0, 0, dimensions.width, dimensions.height);
  }

  context.drawImage(image, 0, 0, dimensions.width, dimensions.height);

  const blob = await canvasToBlob(canvas, mimeType, quality);
  const outputType = blob.type || mimeType;
  return new File([blob], replaceFileExtension(filename, outputType), {
    type: outputType,
    lastModified: Date.now(),
  });
}

async function compressImageForUpload(file: File) {
  if (file.size <= TARGET_UPLOAD_IMAGE_BYTES) {
    return file;
  }

  if (typeof document === "undefined" || typeof Image === "undefined") {
    throw new Error(MAX_UPLOAD_IMAGE_ERROR_TEXT);
  }

  const image = await loadImage(file);
  const sourceWidth = image.naturalWidth || image.width;
  const sourceHeight = image.naturalHeight || image.height;
  const sourceMaxEdge = Math.max(sourceWidth, sourceHeight);
  let bestFile: File | null = null;

  for (
    let maxEdge = Math.min(sourceMaxEdge, MAX_COMPRESSED_IMAGE_EDGE);
    maxEdge >= MIN_COMPRESSED_IMAGE_EDGE;
    maxEdge = Math.floor(maxEdge * COMPRESSION_RESIZE_STEP)
  ) {
    for (
      let quality = INITIAL_COMPRESSION_QUALITY;
      quality >= MIN_COMPRESSION_QUALITY;
      quality -= COMPRESSION_QUALITY_STEP
    ) {
      for (const mimeType of COMPRESSION_OUTPUT_TYPES) {
        const compressedFile = await renderCompressedImage(
          image,
          file.name,
          maxEdge,
          quality,
          mimeType,
        );

        if (!bestFile || compressedFile.size < bestFile.size) {
          bestFile = compressedFile;
        }

        if (compressedFile.size <= TARGET_UPLOAD_IMAGE_BYTES) {
          return compressedFile;
        }
      }
    }
  }

  if (bestFile && bestFile.size <= MAX_UPLOAD_IMAGE_BYTES) {
    return bestFile;
  }

  throw new Error(MAX_UPLOAD_IMAGE_ERROR_TEXT);
}

export async function uploadImageToOss(
  file: File,
  purpose: "post" | "avatar" | "cover",
  options: UploadImageOptions = {},
) {
  const { maxRetries = 2, onProgress, onRetry } = options;

  if (!file.type.startsWith("image/")) {
    throw new Error("请选择图片文件。");
  }

  const uploadFile = await compressImageForUpload(file);

  const maxAttempts = Math.max(1, maxRetries + 1);

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const formData = new FormData();
      formData.set("purpose", purpose);
      formData.set("file", uploadFile);

      onProgress?.(10);

      const uploadResponse = await fetch("/api/oss/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadResponse.ok) {
        const body = (await uploadResponse.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new UploadRequestError(
          body?.error ?? "上传图片失败。",
          uploadResponse.status,
        );
      }

      const uploaded = (await uploadResponse.json()) as OssUploadResponse;
      onProgress?.(100);

      return uploaded;
    } catch (error) {
      if (!shouldRetryUpload(error) || attempt >= maxAttempts) {
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
