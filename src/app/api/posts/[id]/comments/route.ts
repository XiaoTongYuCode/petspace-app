import { NextResponse } from "next/server";
import { z } from "zod";
import { createPostComment, getPostComments } from "@/lib/data";

const postIdSchema = z.string().uuid();
const createCommentSchema = z.object({
  body: z.string().trim().min(1, "请输入评论内容。").max(500),
  parentId: z.string().uuid().nullable().optional(),
});

function countComments(
  comments: Awaited<ReturnType<typeof getPostComments>>,
): number {
  return comments.reduce(
    (total, comment) =>
      total + 1 + countComments(comment.replies),
    0,
  );
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const comments = await getPostComments(id);

  return NextResponse.json({
    comments,
    count: countComments(comments),
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const postId = postIdSchema.safeParse(id);

  if (!postId.success) {
    return NextResponse.json({ error: "动态不存在。" }, { status: 404 });
  }

  const parsed = createCommentSchema.safeParse(
    await request.json().catch(() => null),
  );

  if (!parsed.success) {
    return NextResponse.json({ error: "评论内容无效。" }, { status: 400 });
  }

  try {
    const comments = await createPostComment({
      postId: postId.data,
      body: parsed.data.body,
      parentId: parsed.data.parentId ?? null,
    });

    return NextResponse.json(
      {
        comments,
        count: countComments(comments),
      },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "评论失败。" },
      { status: 400 },
    );
  }
}
