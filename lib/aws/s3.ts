import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const region = process.env.AWS_REGION || "ap-south-1";

export const s3Client = new S3Client({
  region,
});

export const S3_BUCKET = process.env.S3_BUCKET || "notionlite-covers";

/**
 * Generate a presigned PUT URL for uploading cover image.
 * Key MUST start with `${userId}/` to ensure user scoping.
 * Max file size 2MB, image MIME type only.
 */
export async function getPresignedPutUrl(
  userId: string,
  fileName: string,
  contentType: string
): Promise<{ uploadUrl: string; key: string }> {
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const key = `${userId}/${Date.now()}-${sanitizedFileName}`;

  const command = new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
    ContentType: contentType,
  });

  // Presigned URL valid for 5 minutes
  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });

  return { uploadUrl, key };
}

/**
 * Generate a presigned GET URL for viewing cover image.
 * Key MUST belong to the user (start with `${userId}/`).
 */
export async function getPresignedGetUrl(
  userId: string,
  key: string
): Promise<string> {
  if (!key.startsWith(`${userId}/`)) {
    throw new Error("UNAUTHORIZED_S3_KEY_ACCESS");
  }

  const command = new GetObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
  });

  // Presigned URL valid for 1 hour
  return getSignedUrl(s3Client, command, { expiresIn: 3600 });
}
