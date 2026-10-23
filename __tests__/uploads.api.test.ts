import { describe, it, expect } from "vitest";
import { UploadCoverSchema } from "@/lib/zod/schemas";
import { getPresignedGetUrl } from "@/lib/aws/s3";

describe("S3 Uploads & Key Prefix Security", () => {
  it("accepts valid image MIME types", () => {
    const png = UploadCoverSchema.safeParse({
      fileName: "banner.png",
      contentType: "image/png",
    });
    expect(png.success).toBe(true);

    const jpeg = UploadCoverSchema.safeParse({
      fileName: "photo.jpg",
      contentType: "image/jpeg",
    });
    expect(jpeg.success).toBe(true);

    const webp = UploadCoverSchema.safeParse({
      fileName: "artwork.webp",
      contentType: "image/webp",
    });
    expect(webp.success).toBe(true);
  });

  it("rejects non-image MIME types like application/pdf or text/html", () => {
    const pdf = UploadCoverSchema.safeParse({
      fileName: "document.pdf",
      contentType: "application/pdf",
    });
    expect(pdf.success).toBe(false);

    const html = UploadCoverSchema.safeParse({
      fileName: "index.html",
      contentType: "text/html",
    });
    expect(html.success).toBe(false);
  });

  it("throws UNAUTHORIZED_S3_KEY_ACCESS if key does not match userId prefix", async () => {
    const userId = "legitimate-user-123";
    const maliciousKey = "victim-user-456/private-cover.png";

    await expect(getPresignedGetUrl(userId, maliciousKey)).rejects.toThrow(
      "UNAUTHORIZED_S3_KEY_ACCESS"
    );
  });
});
