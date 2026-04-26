import { NextResponse } from "next/server";
import { z } from "zod";
import { updateCurrentProfile } from "@/lib/data";

const profileSchema = z.object({
  displayName: z.string().trim().min(1).max(80).optional(),
  handle: z.string().trim().min(3).max(32).optional(),
  bio: z.string().trim().max(240).optional(),
  avatarUrl: z.string().url().nullable().optional(),
  avatarObjectKey: z.string().max(400).nullable().optional(),
  coverUrl: z.string().url().nullable().optional(),
  coverObjectKey: z.string().max(400).nullable().optional(),
});

export async function PATCH(request: Request) {
  const parsed = profileSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json({ error: "主页资料无效。" }, { status: 400 });
  }

  try {
    const profile = await updateCurrentProfile(parsed.data);

    return NextResponse.json(profile);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "更新主页失败。" },
      { status: 400 },
    );
  }
}
