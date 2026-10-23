import crypto from "crypto";
import { COGNITO_CLIENT_ID, COGNITO_CLIENT_SECRET } from "./cognito";

export function calculateSecretHash(username: string): string | undefined {
  if (!COGNITO_CLIENT_SECRET) {
    return undefined;
  }
  return crypto
    .createHmac("sha256", COGNITO_CLIENT_SECRET)
    .update(username + COGNITO_CLIENT_ID)
    .digest("base64");
}
