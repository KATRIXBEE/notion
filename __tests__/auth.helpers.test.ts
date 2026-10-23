import { describe, it, expect } from "vitest";
import { SignupSchema, LoginSchema, ConfirmSchema } from "@/lib/zod/schemas";
import { checkRateLimit } from "@/lib/auth/rateLimit";
import { calculateSecretHash } from "@/lib/aws/cognitoHash";
import { getZodErrorMessage } from "@/lib/errors";

describe("Auth Validation Schemas", () => {
  it("validates compliant signup payload", () => {
    const valid = SignupSchema.safeParse({
      email: "test@example.com",
      password: "Password123",
    });
    expect(valid.success).toBe(true);
  });

  it("rejects weak passwords missing numbers or uppercase letters", () => {
    const invalid = SignupSchema.safeParse({
      email: "test@example.com",
      password: "password",
    });
    expect(invalid.success).toBe(false);
    if (!invalid.success) {
      const msg = getZodErrorMessage(invalid.error);
      expect(msg).toContain("Password must contain");
    }
  });

  it("validates login payload", () => {
    const valid = LoginSchema.safeParse({
      email: "user@example.com",
      password: "anyPassword",
    });
    expect(valid.success).toBe(true);
  });

  it("validates confirmation code payload", () => {
    const valid = ConfirmSchema.safeParse({
      email: "user@example.com",
      code: "123456",
    });
    expect(valid.success).toBe(true);
  });
});

describe("Rate Limiting", () => {
  it("allows requests under the threshold and throttles after maxRequests", () => {
    const testIp = "192.168.1.100";
    // 10 requests allowed
    for (let i = 0; i < 10; i++) {
      expect(checkRateLimit(testIp)).toBe(true);
    }
    // 11th request throttled
    expect(checkRateLimit(testIp)).toBe(false);
  });
});

describe("Secret Hash Calculation", () => {
  it("returns undefined when no COGNITO_CLIENT_SECRET is configured", () => {
    const hash = calculateSecretHash("test@example.com");
    expect(hash).toBeUndefined();
  });
});
