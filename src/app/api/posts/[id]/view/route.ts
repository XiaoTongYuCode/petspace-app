import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getClerkUserId } from "@/lib/auth";
import { recordPostView } from "@/lib/data";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const clerkUserId = await getClerkUserId();
  let anonymousId = request.cookies.get("petspace_viewer")?.value;

  if (!anonymousId) {
    anonymousId = crypto.randomUUID();
  }

  const viewerKey = clerkUserId ? `user:${clerkUserId}` : `anon:${anonymousId}`;
  const result = await recordPostView(id, viewerKey);
  const response = NextResponse.json(result);

  response.cookies.set("petspace_viewer", anonymousId, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
  });

  return response;
}
