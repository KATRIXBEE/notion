import { NextResponse } from "next/server";
import { InitiateAuthCommand } from "@aws-sdk/client-cognito-identity-provider";
import { cognitoClient, COGNITO_CLIENT_ID } from "@/lib/aws/cognito";
import { getAuthCookies, setAuthCookies, clearAuthCookies } from "@/lib/auth/cookies";
import { apiError, internalError } from "@/lib/errors";

export async function POST() {
  try {
    const { refreshToken } = getAuthCookies();
    if (!refreshToken) {
      return apiError("UNAUTHORIZED", "No refresh token available", 401);
    }

    const command = new InitiateAuthCommand({
      AuthFlow: "REFRESH_TOKEN_AUTH",
      ClientId: COGNITO_CLIENT_ID,
      AuthParameters: {
        REFRESH_TOKEN: refreshToken,
      },
    });

    const response = await cognitoClient.send(command);
    const authResult = response.AuthenticationResult;

    if (!authResult || !authResult.IdToken || !authResult.AccessToken) {
      const res = apiError("REFRESH_FAILED", "Unable to refresh session. Please log in again.", 401);
      clearAuthCookies(res);
      return res;
    }

    const res = NextResponse.json({
      success: true,
      message: "Session refreshed.",
    });

    setAuthCookies(res, {
      idToken: authResult.IdToken,
      accessToken: authResult.AccessToken,
      refreshToken: authResult.RefreshToken || refreshToken,
    });

    return res;
  } catch (err: unknown) {
    const error = err as { name?: string };
    if (error.name === "NotAuthorizedException") {
      const res = apiError("SESSION_EXPIRED", "Session expired. Please log in again.", 401);
      clearAuthCookies(res);
      return res;
    }
    return internalError(err);
  }
}
