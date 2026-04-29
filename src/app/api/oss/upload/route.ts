import { NextResponse } from "next/server";
import { z } from "zod";
import { getClerkUserId } from "@/lib/auth";
import { uploadImageForUser } from "@/lib/oss";

const requestSchema = z.object({
  purpose: z.enum(["post", "avatar", "cover"]),
});

export async function POST(request: Request) {
  const clerkUserId = await getClerkUserId();

  if (!clerkUserId) {
    return NextResponse.json({ error: "请先登录后再上传图片。" }, { status: 401 });
  }

  const formData = await request.formData().catch(() => null);

  if (!formData) {
    return NextResponse.json({ error: "上传表单无效。" }, { status: 400 });
  }

  const parsed = requestSchema.safeParse({
    purpose: formData.get("purpose"),
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "上传参数无效。" }, { status: 400 });
  }

  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "请选择要上传的图片。" }, { status: 400 });
  }

  try {
    const upload = await uploadImageForUser({
      purpose: parsed.data.purpose,
      clerkUserId,
      file,
    });

    return NextResponse.json(upload);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "上传失败。" },
      { status: 400 },
    );
  }
}
