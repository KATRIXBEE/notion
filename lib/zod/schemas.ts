import { z } from "zod";

export const SignupSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .regex(/[A-Z]/, "Password must contain an uppercase letter")
    .regex(/[a-z]/, "Password must contain a lowercase letter")
    .regex(/[0-9]/, "Password must contain a number"),
});

export const ConfirmSchema = z.object({
  email: z.string().email("Invalid email address"),
  code: z.string().min(4, "Confirmation code required"),
});

export const LoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const CreatePageSchema = z.object({
  title: z.string().max(200).default("Untitled"),
  parentId: z.string().nullable().optional(),
  icon: z.string().max(10).optional(),
  content: z.string().default(""),
  coverKey: z.string().nullable().optional(),
});

export const UpdatePageSchema = z.object({
  title: z.string().max(200).optional(),
  parentId: z.string().nullable().optional(),
  icon: z.string().max(10).nullable().optional(),
  content: z.string().optional(),
  coverKey: z.string().nullable().optional(),
  isFavorite: z.boolean().optional(),
  isDeleted: z.boolean().optional(),
});

export const SearchQuerySchema = z.object({
  q: z.string().min(1).max(100),
});

export const UploadCoverSchema = z.object({
  fileName: z.string().min(1).max(255),
  contentType: z.enum([
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
  ]),
});
