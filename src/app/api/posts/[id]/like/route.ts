import { NextResponse } from "next/server";
import { togglePostLike } from "@/lib/data";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const result = await togglePostLike(id);

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "点赞失败。" },
      { status: 400 },
    );
  }
}
