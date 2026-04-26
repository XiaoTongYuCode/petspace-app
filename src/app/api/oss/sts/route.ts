import { NextResponse } from "next/server";
import { z } from "zod";
import { getClerkUserId } from "@/lib/auth";
import { createOssStsToken } from "@/lib/oss";

const requestSchema = z.object({
  purpose: z.enum(["post", "avatar", "cover"]),
  filename: z.string().min(1).max(160),
  contentType: z.string().min(1).max(80),
});

export async function POST(request: Request) {
  const clerkUserId = await getClerkUserId();

  if (!clerkUserId) {
    return NextResponse.json({ error: "请先登录后再上传图片。" }, { status: 401 });
  }

  const parsed = requestSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json({ error: "上传参数无效。" }, { status: 400 });
  }

  try {
    const token = await createOssStsToken({
      ...parsed.data,
      clerkUserId,
    });

    return NextResponse.json(token);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "获取上传凭证失败。" },
      { status: 400 },
    );
  }
}
