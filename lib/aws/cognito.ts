import { CognitoIdentityProviderClient } from "@aws-sdk/client-cognito-identity-provider";

const region = process.env.AWS_REGION || "ap-south-1";

export const cognitoClient = new CognitoIdentityProviderClient({
  region,
});

export const COGNITO_USER_POOL_ID = process.env.COGNITO_USER_POOL_ID || "";
export const COGNITO_CLIENT_ID = process.env.COGNITO_CLIENT_ID || "";
export const COGNITO_CLIENT_SECRET = process.env.COGNITO_CLIENT_SECRET || "";
