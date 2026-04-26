import { NextResponse } from "next/server";
import { togglePostFavorite } from "@/lib/data";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const result = await togglePostFavorite(id);

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "收藏失败。" },
      { status: 400 },
    );
  }
}
