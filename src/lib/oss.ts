import crypto from "node:crypto";

export type OssPurpose = "post" | "avatar" | "cover";

export type OssUploadResponse = {
  objectKey: string;
  url: string;
};

export const MAX_UPLOAD_IMAGE_BYTES = 8 * 1024 * 1024;

export function hasOssEnv() {
  return Boolean(
    process.env.ALIYUN_ACCESS_KEY_ID &&
      process.env.ALIYUN_ACCESS_KEY_SECRET &&
      process.env.ALIYUN_OSS_BUCKET &&
      process.env.ALIYUN_OSS_REGION &&
      process.env.ALIYUN_OSS_ENDPOINT,
  );
}

export function assertImageUpload(
  contentType: string,
  filename: string,
  fileSize?: number,
) {
  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];

  if (!allowedTypes.includes(contentType)) {
    throw new Error("仅支持 JPG、PNG、WEBP 或 GIF 图片。");
  }

  const safeName = filename.trim();

  if (!safeName || safeName.length > 160) {
    throw new Error("图片文件名无效。");
  }

  if (typeof fileSize === "number" && fileSize > MAX_UPLOAD_IMAGE_BYTES) {
    throw new Error("图片不能超过 8MB。");
  }
}

export function createObjectKey(
  purpose: OssPurpose,
  clerkUserId: string,
  filename: string,
) {
  const ext = filename.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "");
  const suffix = ext ? `.${ext.slice(0, 8)}` : "";

  return `${purpose}/${clerkUserId}/${crypto.randomUUID()}${suffix}`;
}

export function createPublicUrl(objectKey: string) {
  const publicBase = process.env.ALIYUN_OSS_PUBLIC_BASE_URL?.replace(/\/+$/, "");

  if (publicBase) {
    return `${publicBase}/${objectKey}`;
  }

  const endpoint = process.env.ALIYUN_OSS_ENDPOINT?.replace(/^https?:\/\//, "");
  return `https://${process.env.ALIYUN_OSS_BUCKET}.${endpoint}/${objectKey}`;
}

async function createOssClient() {
  if (!hasOssEnv()) {
    throw new Error("阿里云 OSS 环境变量未配置完整。");
  }

  const OSS = (await import("ali-oss")).default;
  return new OSS({
    accessKeyId: process.env.ALIYUN_ACCESS_KEY_ID!,
    accessKeySecret: process.env.ALIYUN_ACCESS_KEY_SECRET!,
    bucket: process.env.ALIYUN_OSS_BUCKET!,
    endpoint: process.env.ALIYUN_OSS_ENDPOINT!,
    region: process.env.ALIYUN_OSS_REGION!,
    secure: true,
  });
}

export async function uploadObjectToOss(params: {
  objectKey: string;
  content: Buffer;
  contentType: string;
}) {
  if (!hasOssEnv()) {
    throw new Error("阿里云 OSS 环境变量未配置完整。");
  }

  const client = await createOssClient();
  await client.put(params.objectKey, params.content, {
    mime: params.contentType,
    headers: {
      "Content-Type": params.contentType,
    },
  });
}

export async function uploadImageBufferForUser(params: {
  purpose: OssPurpose;
  clerkUserId: string;
  filename: string;
  contentType: string;
  fileSize: number;
  content: Buffer;
}): Promise<OssUploadResponse> {
  assertImageUpload(params.contentType, params.filename, params.fileSize);

  const objectKey = createObjectKey(
    params.purpose,
    params.clerkUserId,
    params.filename,
  );

  await uploadObjectToOss({
    objectKey,
    content: params.content,
    contentType: params.contentType,
  });

  return {
    objectKey,
    url: createPublicUrl(objectKey),
  };
}

export async function uploadImageForUser(params: {
  purpose: OssPurpose;
  clerkUserId: string;
  file: File;
}): Promise<OssUploadResponse> {
  return uploadImageBufferForUser({
    purpose: params.purpose,
    clerkUserId: params.clerkUserId,
    filename: params.file.name,
    contentType: params.file.type,
    fileSize: params.file.size,
    content: Buffer.from(await params.file.arrayBuffer()),
  });
}
