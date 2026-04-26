import { NextResponse } from "next/server";
import { getBackendStatus } from "@/lib/backend-status";

export const dynamic = "force-dynamic";

export async function GET() {
  const status = await getBackendStatus({ checkDatabase: true });

  return NextResponse.json(status, { status: status.ready ? 200 : 503 });
}
