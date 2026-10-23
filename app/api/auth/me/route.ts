import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth/verify";
import { apiError } from "@/lib/errors";

export async function GET(req: NextRequest) {
  const user = await verifyAuth(req);
  if (!user) {
    return apiError("UNAUTHORIZED", "Not authenticated", 401);
  }

  return NextResponse.json({
    user: {
      userId: user.userId,
      email: user.email,
      username: user.username,
    },
  });
}
