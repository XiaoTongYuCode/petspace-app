import { NextResponse } from "next/server";
import { z } from "zod";
import { getClerkUserId } from "@/lib/auth";
import { createPublicUrl, isAllowedObjectKey, objectExistsInOss } from "@/lib/oss";

const requestSchema = z.object({
  purpose: z.enum(["post", "avatar", "cover"]),
  objectKey: z.string().min(1).max(400),
});

export async function POST(request: Request) {
  const clerkUserId = await getClerkUserId();

  if (!clerkUserId) {
    return NextResponse.json({ error: "请先登录后再确认上传。" }, { status: 401 });
  }

  const parsed = requestSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json({ error: "上传确认参数无效。" }, { status: 400 });
  }

  const { objectKey, purpose } = parsed.data;

  if (!isAllowedObjectKey(objectKey, purpose, clerkUserId)) {
    return NextResponse.json({ error: "上传对象路径无效。" }, { status: 403 });
  }

  const exists = await objectExistsInOss(objectKey);

  if (!exists) {
    return NextResponse.json({ exists: false }, { status: 404 });
  }

  return NextResponse.json({
    exists: true,
    objectKey,
    url: createPublicUrl(objectKey),
  });
}
