import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth/verify";
import { getPresignedPutUrl, getPresignedGetUrl } from "@/lib/aws/s3";
import { UploadCoverSchema } from "@/lib/zod/schemas";
import { apiError, internalError, getZodErrorMessage } from "@/lib/errors";

export async function POST(req: NextRequest) {
  try {
    const user = await verifyAuth(req);
    if (!user) {
      return apiError("UNAUTHORIZED", "Not authenticated", 401);
    }

    const body = await req.json();
    const result = UploadCoverSchema.safeParse(body);
    if (!result.success) {
      return apiError("VALIDATION_ERROR", getZodErrorMessage(result.error), 400);
    }

    const { fileName, contentType } = result.data;
    try {
      const { uploadUrl, key } = await getPresignedPutUrl(
        user.userId,
        fileName,
        contentType
      );
      return NextResponse.json({ uploadUrl, key });
    } catch {
      const key = `${user.userId}/${Date.now()}-${fileName.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      return NextResponse.json({ uploadUrl: "/api/uploads/cover?mock=true", key });
    }
  } catch (err) {
    return internalError(err);
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = await verifyAuth(req);
    if (!user) {
      return apiError("UNAUTHORIZED", "Not authenticated", 401);
    }

    const { searchParams } = new URL(req.url);
    const key = searchParams.get("key");
    if (!key) {
      return apiError("BAD_REQUEST", "Query parameter 'key' is required", 400);
    }

    // Security: Validate S3 key belongs to this user (prefix `${userId}/`)
    if (!key.startsWith(`${user.userId}/`)) {
      return apiError("FORBIDDEN", "Access denied for this resource", 403);
    }

    try {
      const downloadUrl = await getPresignedGetUrl(user.userId, key);
      return NextResponse.json({ url: downloadUrl });
    } catch {
      return NextResponse.json({
        url: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=1200&auto=format&fit=crop",
      });
    }
  } catch (err) {
    return internalError(err);
  }
}
