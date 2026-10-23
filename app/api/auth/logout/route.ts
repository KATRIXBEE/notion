import { NextResponse } from "next/server";
import { GlobalSignOutCommand } from "@aws-sdk/client-cognito-identity-provider";
import { cognitoClient } from "@/lib/aws/cognito";
import { getAuthCookies, clearAuthCookies } from "@/lib/auth/cookies";
import { logger } from "@/lib/logger";

export async function POST() {
  const { accessToken } = getAuthCookies();

  if (accessToken) {
    try {
      await cognitoClient.send(
        new GlobalSignOutCommand({
          AccessToken: accessToken,
        })
      );
    } catch (err) {
      logger.warn("Cognito GlobalSignOut failed or token expired", {
        err: err instanceof Error ? err.message : String(err),
      });
    }
  }

  const res = NextResponse.json({
    success: true,
    message: "Logged out successfully.",
  });

  clearAuthCookies(res);
  return res;
}
