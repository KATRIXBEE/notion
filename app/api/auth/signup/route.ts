import { NextRequest, NextResponse } from "next/server";
import { SignUpCommand } from "@aws-sdk/client-cognito-identity-provider";
import { cognitoClient, COGNITO_CLIENT_ID } from "@/lib/aws/cognito";
import { calculateSecretHash } from "@/lib/aws/cognitoHash";
import { SignupSchema } from "@/lib/zod/schemas";
import { checkRateLimit } from "@/lib/auth/rateLimit";
import { setAuthCookies } from "@/lib/auth/cookies";
import { apiError, internalError, getZodErrorMessage } from "@/lib/errors";

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    if (!checkRateLimit(ip)) {
      return apiError("TOO_MANY_REQUESTS", "Too many attempts. Please try again later.", 429);
    }

    const body = await req.json();
    const result = SignupSchema.safeParse(body);
    if (!result.success) {
      return apiError("VALIDATION_ERROR", getZodErrorMessage(result.error), 400);
    }

    const { email, password } = result.data;

    // Local dev mode fallback if Cognito client ID is not configured
    if (!COGNITO_CLIENT_ID || COGNITO_CLIENT_ID.startsWith("xxxx")) {
      const mockUserId = "usr_" + Buffer.from(email).toString("hex").slice(0, 12);
      const res = NextResponse.json(
        {
          success: true,
          autoLogin: true,
          message: "Account created and logged in.",
          user: { userId: mockUserId, email },
        },
        { status: 201 }
      );
      setAuthCookies(res, {
        idToken: `mock-user:${mockUserId}:${email}`,
        accessToken: `mock-access:${mockUserId}`,
        refreshToken: `mock-refresh:${mockUserId}`,
      });
      return res;
    }

    // Send SignUpCommand to Cognito
    const command = new SignUpCommand({
      ClientId: COGNITO_CLIENT_ID,
      Username: email,
      Password: password,
      SecretHash: calculateSecretHash(email),
      UserAttributes: [
        {
          Name: "email",
          Value: email,
        },
      ],
    });

    await cognitoClient.send(command);

    return NextResponse.json(
      {
        success: true,
        message: "Sign up successful. Please check your email for confirmation code.",
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    const error = err as { name?: string; message?: string };
    if (error.name === "UsernameExistsException") {
      return apiError("USER_EXISTS", "An account with this email already exists.", 409);
    }
    if (error.name === "InvalidPasswordException") {
      return apiError("INVALID_PASSWORD", error.message || "Password does not meet requirements.", 400);
    }
    return internalError(err);
  }
}
