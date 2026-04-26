import crypto from "node:crypto";

type OssPurpose = "post" | "avatar" | "cover";

export type OssStsResponse = {
  bucket: string;
  region: string;
  endpoint: string;
  objectKey: string;
  publicUrl: string;
  expiresAt: string;
  credentials: {
    accessKeyId: string;
    accessKeySecret: string;
    stsToken: string;
  };
};

export function hasOssEnv() {
  return Boolean(
    process.env.ALIYUN_ACCESS_KEY_ID &&
      process.env.ALIYUN_ACCESS_KEY_SECRET &&
      process.env.ALIYUN_OSS_ROLE_ARN &&
      process.env.ALIYUN_OSS_BUCKET &&
      process.env.ALIYUN_OSS_REGION &&
      process.env.ALIYUN_OSS_ENDPOINT,
  );
}

export function assertImageUpload(contentType: string, filename: string) {
  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];

  if (!allowedTypes.includes(contentType)) {
    throw new Error("仅支持 JPG、PNG、WEBP 或 GIF 图片。");
  }

  const safeName = filename.trim();

  if (!safeName || safeName.length > 160) {
    throw new Error("图片文件名无效。");
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

export function isAllowedObjectKey(
  objectKey: string,
  purpose: OssPurpose,
  clerkUserId: string,
) {
  const prefix = `${purpose}/${clerkUserId}/`;

  return (
    objectKey.startsWith(prefix) &&
    objectKey.length > prefix.length &&
    objectKey.length <= 400 &&
    !objectKey.includes("..") &&
    !objectKey.includes("\\")
  );
}

export async function objectExistsInOss(objectKey: string) {
  if (!hasOssEnv()) {
    throw new Error("阿里云 OSS 环境变量未配置完整。");
  }

  const OSS = (await import("ali-oss")).default;
  const client = new OSS({
    accessKeyId: process.env.ALIYUN_ACCESS_KEY_ID!,
    accessKeySecret: process.env.ALIYUN_ACCESS_KEY_SECRET!,
    bucket: process.env.ALIYUN_OSS_BUCKET!,
    endpoint: process.env.ALIYUN_OSS_ENDPOINT!,
    region: process.env.ALIYUN_OSS_REGION!,
    secure: true,
  });

  try {
    await client.head(objectKey);
    return true;
  } catch {
    return false;
  }
}

export async function createOssStsToken(params: {
  purpose: OssPurpose;
  clerkUserId: string;
  filename: string;
  contentType: string;
}): Promise<OssStsResponse> {
  if (!hasOssEnv()) {
    throw new Error("阿里云 OSS 环境变量未配置完整。");
  }

  assertImageUpload(params.contentType, params.filename);

  const objectKey = createObjectKey(params.purpose, params.clerkUserId, params.filename);
  const bucket = process.env.ALIYUN_OSS_BUCKET!;
  const policy = {
    Version: "1",
    Statement: [
      {
        Effect: "Allow",
        Action: ["oss:PutObject"],
        Resource: [`acs:oss:*:*:${bucket}/${objectKey}`],
      },
    ],
  };
  const OSS = (await import("ali-oss")).default;
  const sts = new OSS.STS({
    accessKeyId: process.env.ALIYUN_ACCESS_KEY_ID!,
    accessKeySecret: process.env.ALIYUN_ACCESS_KEY_SECRET!,
  });
  const durationSeconds = 900;
  const { credentials } = await sts.assumeRole(
    process.env.ALIYUN_OSS_ROLE_ARN!,
    policy,
    durationSeconds,
    `petspace-${params.purpose}`,
  );

  return {
    bucket,
    region: process.env.ALIYUN_OSS_REGION!,
    endpoint: process.env.ALIYUN_OSS_ENDPOINT!,
    objectKey,
    publicUrl: createPublicUrl(objectKey),
    expiresAt: credentials.Expiration,
    credentials: {
      accessKeyId: credentials.AccessKeyId,
      accessKeySecret: credentials.AccessKeySecret,
      stsToken: credentials.SecurityToken,
    },
  };
}
