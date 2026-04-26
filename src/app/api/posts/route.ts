import { NextResponse } from "next/server";
import { z } from "zod";
import { createPost } from "@/lib/data";

const createPostSchema = z.object({
  caption: z.string().trim().min(1, "请输入动态内容。").max(500),
  imageUrl: z.string().url(),
  imageObjectKey: z.string().max(400).nullable().optional(),
  category: z.string().trim().min(1).max(32).optional(),
  location: z.string().trim().max(80).nullable().optional(),
});

export async function POST(request: Request) {
  const parsed = createPostSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json({ error: "动态内容无效。" }, { status: 400 });
  }

  try {
    const post = await createPost(parsed.data);

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "发布失败。" },
      { status: 400 },
    );
  }
}
