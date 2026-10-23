import { ulid as generateUlid } from "ulid";

export function generatePageId(): string {
  return generateUlid();
}
