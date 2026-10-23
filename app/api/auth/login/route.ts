import { NextRequest, NextResponse } from "next/server";
import { InitiateAuthCommand } from "@aws-sdk/client-cognito-identity-provider";
import { cognitoClient, COGNITO_CLIENT_ID } from "@/lib/aws/cognito";
import { calculateSecretHash } from "@/lib/aws/cognitoHash";
import { LoginSchema } from "@/lib/zod/schemas";
import { checkRateLimit } from "@/lib/auth/rateLimit";
import { setAuthCookies } from "@/lib/auth/cookies";
import { apiError, internalError, getZodErrorMessage } from "@/lib/errors";

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    if (!checkRateLimit(ip)) {
      return apiError("TOO_MANY_REQUESTS", "Too many login attempts. Please try again later.", 429);
    }

    const body = await req.json();
    const result = LoginSchema.safeParse(body);
    if (!result.success) {
      return apiError("VALIDATION_ERROR", getZodErrorMessage(result.error), 400);
    }

    const { email, password } = result.data;

    // Local dev mode fallback if Cognito client ID is not configured
    if (!COGNITO_CLIENT_ID || COGNITO_CLIENT_ID.startsWith("xxxx")) {
      const mockUserId = "usr_" + Buffer.from(email).toString("hex").slice(0, 12);
      const res = NextResponse.json({
        success: true,
        message: "Logged in successfully.",
        user: { userId: mockUserId, email },
      });
      setAuthCookies(res, {
        idToken: `mock-user:${mockUserId}:${email}`,
        accessToken: `mock-access:${mockUserId}`,
        refreshToken: `mock-refresh:${mockUserId}`,
      });
      return res;
    }

    const secretHash = calculateSecretHash(email);

    const authParameters: Record<string, string> = {
      USERNAME: email,
      PASSWORD: password,
    };
    if (secretHash) {
      authParameters.SECRET_HASH = secretHash;
    }

    const command = new InitiateAuthCommand({
      AuthFlow: "USER_PASSWORD_AUTH",
      ClientId: COGNITO_CLIENT_ID,
      AuthParameters: authParameters,
    });

    const response = await cognitoClient.send(command);
    const authResult = response.AuthenticationResult;

    if (!authResult || !authResult.IdToken || !authResult.AccessToken) {
      return apiError("AUTH_FAILED", "Authentication failed. Please check credentials.", 401);
    }

    const res = NextResponse.json({
      success: true,
      message: "Logged in successfully.",
    });

    // Set httpOnly, Secure, SameSite=Lax cookies (tokens are NEVER returned in response JSON)
    setAuthCookies(res, {
      idToken: authResult.IdToken,
      accessToken: authResult.AccessToken,
      refreshToken: authResult.RefreshToken,
    });

    return res;
  } catch (err: unknown) {
    const error = err as { name?: string; message?: string };
    if (
      error.name === "NotAuthorizedException" ||
      error.name === "UserNotFoundException"
    ) {
      return apiError("INVALID_CREDENTIALS", "Incorrect email or password.", 401);
    }
    if (error.name === "UserNotConfirmedException") {
      return apiError("USER_NOT_CONFIRMED", "Please confirm your email address first.", 403);
    }
    return internalError(err);
  }
}
