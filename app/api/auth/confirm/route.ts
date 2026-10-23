import { NextRequest, NextResponse } from "next/server";
import { ConfirmSignUpCommand } from "@aws-sdk/client-cognito-identity-provider";
import { cognitoClient, COGNITO_CLIENT_ID } from "@/lib/aws/cognito";
import { calculateSecretHash } from "@/lib/aws/cognitoHash";
import { ConfirmSchema } from "@/lib/zod/schemas";
import { checkRateLimit } from "@/lib/auth/rateLimit";
import { apiError, internalError, getZodErrorMessage } from "@/lib/errors";

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    if (!checkRateLimit(ip)) {
      return apiError("TOO_MANY_REQUESTS", "Too many attempts. Please try again later.", 429);
    }

    const body = await req.json();
    const result = ConfirmSchema.safeParse(body);
    if (!result.success) {
      return apiError("VALIDATION_ERROR", getZodErrorMessage(result.error), 400);
    }

    const { email, code } = result.data;

    if (!COGNITO_CLIENT_ID || COGNITO_CLIENT_ID.startsWith("xxxx")) {
      const mockUserId = "usr_" + Buffer.from(email).toString("hex").slice(0, 12);
      const res = NextResponse.json({
        success: true,
        message: "Account confirmed successfully.",
        user: { userId: mockUserId, email },
      });
      const { setAuthCookies } = await import("@/lib/auth/cookies");
      setAuthCookies(res, {
        idToken: `mock-user:${mockUserId}:${email}`,
        accessToken: `mock-access:${mockUserId}`,
        refreshToken: `mock-refresh:${mockUserId}`,
      });
      return res;
    }

    const command = new ConfirmSignUpCommand({
      ClientId: COGNITO_CLIENT_ID,
      Username: email,
      ConfirmationCode: code,
      SecretHash: calculateSecretHash(email),
    });

    await cognitoClient.send(command);

    return NextResponse.json({
      success: true,
      message: "Account confirmed successfully.",
    });
  } catch (err: unknown) {
    const error = err as { name?: string; message?: string };
    if (error.name === "CodeMismatchException") {
      return apiError("INVALID_CODE", "Invalid confirmation code provided.", 400);
    }
    if (error.name === "ExpiredCodeException") {
      return apiError("EXPIRED_CODE", "Confirmation code has expired. Please request a new one.", 400);
    }
    return internalError(err);
  }
}
