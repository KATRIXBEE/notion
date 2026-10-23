import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const ID_TOKEN_COOKIE = "nl_id_token";
export const ACCESS_TOKEN_COOKIE = "nl_access_token";
export const REFRESH_TOKEN_COOKIE = "nl_refresh_token";

const COOKIE_BASE_OPTIONS = {
  httpOnly: true,
  secure: process.env.COOKIE_SECURE === "true",
  sameSite: "lax" as const,
  path: "/",
};

export interface TokenSet {
  idToken: string;
  accessToken: string;
  refreshToken?: string;
}

/**
 * Sets auth cookies on a NextResponse object
 */
export function setAuthCookies(response: NextResponse, tokens: TokenSet) {
  // ID token: 1 hour (standard Cognito lifetime)
  response.cookies.set(ID_TOKEN_COOKIE, tokens.idToken, {
    ...COOKIE_BASE_OPTIONS,
    maxAge: 3600,
  });

  // Access token: 1 hour
  response.cookies.set(ACCESS_TOKEN_COOKIE, tokens.accessToken, {
    ...COOKIE_BASE_OPTIONS,
    maxAge: 3600,
  });

  // Refresh token: 30 days
  if (tokens.refreshToken) {
    response.cookies.set(REFRESH_TOKEN_COOKIE, tokens.refreshToken, {
      ...COOKIE_BASE_OPTIONS,
      maxAge: 30 * 24 * 3600,
    });
  }
}

/**
 * Clears all auth cookies on a NextResponse object
 */
export function clearAuthCookies(response: NextResponse) {
  response.cookies.set(ID_TOKEN_COOKIE, "", {
    ...COOKIE_BASE_OPTIONS,
    maxAge: 0,
  });
  response.cookies.set(ACCESS_TOKEN_COOKIE, "", {
    ...COOKIE_BASE_OPTIONS,
    maxAge: 0,
  });
  response.cookies.set(REFRESH_TOKEN_COOKIE, "", {
    ...COOKIE_BASE_OPTIONS,
    maxAge: 0,
  });
}

/**
 * Read current tokens from the incoming cookies
 */
export function getAuthCookies() {
  const cookieStore = cookies();
  return {
    idToken: cookieStore.get(ID_TOKEN_COOKIE)?.value,
    accessToken: cookieStore.get(ACCESS_TOKEN_COOKIE)?.value,
    refreshToken: cookieStore.get(REFRESH_TOKEN_COOKIE)?.value,
  };
}
