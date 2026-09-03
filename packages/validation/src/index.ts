import { z, ZodError } from 'zod';

export { z, ZodError };

export const uuidSchema = z.string().uuid();

export const slugSchema = z
  .string()
  .min(1)
  .max(160)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

export const registerBodySchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(12).max(128),
  displayName: z.string().trim().min(1).max(80),
  username: slugSchema,
});

export const loginBodySchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(1).max(128),
});

export const tokenBodySchema = z.object({
  token: z.string().min(1).max(512),
});

export const resetPasswordBodySchema = z.object({
  token: z.string().min(1).max(512),
  password: z.string().min(12).max(128),
});

export const forgotPasswordBodySchema = z.object({
  email: z.string().email().max(254),
});

const publicHttpsUrlSchema = z
  .string()
  .url()
  .max(2048)
  .refine((value) => {
    try {
      return new URL(value).protocol === 'https:';
    } catch {
      return false;
    }
  }, 'URL must use https');

export const updateProfileBodySchema = z
  .object({
    displayName: z.string().trim().min(1).max(80).optional(),
    bio: z.string().max(500).optional(),
    avatarUrl: publicHttpsUrlSchema.nullable().optional(),
    websiteUrl: publicHttpsUrlSchema.nullable().optional(),
  })
  .refine(
    (value) =>
      value.displayName !== undefined ||
      value.bio !== undefined ||
      value.avatarUrl !== undefined ||
      value.websiteUrl !== undefined,
    { message: 'At least one profile field is required' },
  );

export const articleDraftBodySchema = z.object({
  title: z.string().trim().min(1).max(200),
  abstract: z.string().max(2000),
  content: z.string().max(200_000),
  language: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z]{2}$/, 'Language must be a two-letter ISO 639-1 code'),
  categoryIds: z.array(uuidSchema).min(1).max(5),
  tagNames: z.array(z.string().trim().min(1).max(40)).max(10).default([]),
});

export const updateArticleDraftBodySchema = z.object({
  title: z.string().trim().min(1).max(200),
  abstract: z.string().max(2000),
  content: z.string().max(200_000),
  categoryIds: z.array(uuidSchema).min(1).max(5),
  tagNames: z.array(z.string().trim().min(1).max(40)).max(10).default([]),
});

export const moderateArticleBodySchema = z.object({
  decision: z.enum(['APPROVE', 'REQUEST_REVISION', 'REJECT']),
  reason: z.string().trim().min(8).max(2000),
  notes: z.string().max(8000).optional(),
});

export const flagArticleBodySchema = z.object({
  reason: z.string().trim().min(8).max(2000),
  notes: z.string().max(8000).optional(),
});
