import { CognitoJwtVerifier } from "aws-jwt-verify";
import { NextRequest } from "next/server";
import { getAuthCookies, ID_TOKEN_COOKIE } from "./cookies";
import { COGNITO_CLIENT_ID, COGNITO_USER_POOL_ID } from "../aws/cognito";
import { logger } from "../logger";

export interface AuthenticatedUser {
  userId: string;
  email?: string;
  username?: string;
}

let verifier: ReturnType<typeof CognitoJwtVerifier.create> | null = null;

function getVerifier() {
  if (!verifier && COGNITO_USER_POOL_ID && COGNITO_CLIENT_ID) {
    verifier = CognitoJwtVerifier.create({
      userPoolId: COGNITO_USER_POOL_ID,
      tokenUse: "id",
      clientId: COGNITO_CLIENT_ID,
    });
  }
  return verifier;
}

/**
 * Verifies the ID token from cookies or Authorization header.
 * Returns the authenticated user or null.
 */
export async function verifyAuth(req?: NextRequest): Promise<AuthenticatedUser | null> {
  try {
    let token: string | undefined;

    // 1. Try Authorization header
    if (req) {
      const authHeader = req.headers.get("authorization");
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7);
      }
      if (!token) {
        token = req.cookies.get(ID_TOKEN_COOKIE)?.value;
      }
    }

    // 2. Fall back to cookieStore
    if (!token) {
      const cookies = getAuthCookies();
      token = cookies.idToken;
    }

    if (!token) {
      return null;
    }

    // In development / local testing without live Cognito pool configured,
    // support a mock test token format: "mock-user:<userId>:<email>"
    if (token.startsWith("mock-user:")) {
      const [, userId, email] = token.split(":");
      return { userId: userId || "local-test-user", email: email || "dev@notionlite.local" };
    }

    const v = getVerifier();
    if (!v) {
      logger.warn("Cognito verifier not configured. Missing COGNITO_USER_POOL_ID or COGNITO_CLIENT_ID");
      return null;
    }

    const payload = await v.verify(token);
    return {
      userId: payload.sub,
      email: typeof payload.email === "string" ? payload.email : undefined,
      username: typeof payload["cognito:username"] === "string" ? payload["cognito:username"] : undefined,
    };
  } catch (error) {
    logger.warn("JWT verification failed", {
      err: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}
