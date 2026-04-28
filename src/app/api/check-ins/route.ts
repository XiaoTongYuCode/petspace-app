import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getCurrentUserCheckInStatus,
  recordCurrentUserCheckIn,
} from "@/lib/data";

export const dynamic = "force-dynamic";

const checkInSchema = z.object({
  scope: z.string().trim().min(1).max(64).optional(),
  timeZone: z.string().trim().min(1).max(64).optional(),
});

function getErrorStatus(error: unknown) {
  if (error instanceof Error && error.message.includes("登录")) {
    return 401;
  }

  return 400;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = checkInSchema.safeParse({
    scope: url.searchParams.get("scope") ?? undefined,
    timeZone: url.searchParams.get("timeZone") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "打卡参数无效。" }, { status: 400 });
  }

  const status = await getCurrentUserCheckInStatus(parsed.data);

  return NextResponse.json(status);
}

export async function POST(request: Request) {
  const parsed = checkInSchema.safeParse(await request.json().catch(() => ({})));

  if (!parsed.success) {
    return NextResponse.json({ error: "打卡参数无效。" }, { status: 400 });
  }

  try {
    const status = await recordCurrentUserCheckIn(parsed.data);

    return NextResponse.json(status, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "打卡失败。" },
      { status: getErrorStatus(error) },
    );
  }
}
