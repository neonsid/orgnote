import { z } from "zod";

// Common field validations
const nameSchema = z
  .string()
  .min(2, "Name must be at least 2 characters")
  .max(50, "Name must be at most 50 characters")
  .trim();

const emailSchema = z
  .string()
  .min(1, "Email is required")
  .max(254, "Email must be at most 254 characters")
  .email("Please enter a valid email address")
  .trim()
  .toLowerCase();

// Password with detailed requirements
const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password must be at most 128 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter (A-Z)")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter (a-z)")
  .regex(/[0-9]/, "Password must contain at least one number (0-9)")
  .regex(
    /[^A-Za-z0-9]/,
    "Password must contain at least one special character (!@#$%^&* etc.)",
  );

const confirmPasswordSchema = z.string();

// Auth schemas
export const loginSchema = z.object({
  email: emailSchema,
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password must be at most 128 characters"),
});

export const signupSchema = z
  .object({
    name: nameSchema,
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: confirmPasswordSchema,
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: confirmPasswordSchema,
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: passwordSchema,
    confirmPassword: confirmPasswordSchema,
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

// User profile schemas
export const updateNameSchema = z.object({
  name: nameSchema,
});

const usernameSchema = z
  .string()
  .min(3, "Username must be at least 3 characters")
  .max(30, "Username must be at most 30 characters")
  .regex(
    /^[a-zA-Z0-9_-]+$/,
    "Username can only contain letters, numbers, underscores, and hyphens",
  )
  .trim();

const bioSchema = z
  .string()
  .max(500, "Bio must be at most 500 characters")
  .optional()
  .or(z.literal(""));

const urlSchema = z
  .string()
  .max(200, "URL must be at most 200 characters")
  .optional()
  .or(z.literal(""));

const twitterSchema = z
  .string()
  .max(15, "Twitter username must be at most 15 characters")
  .optional()
  .or(z.literal(""));

export const publicProfileSchema = z.object({
  isPublic: z.boolean(),
  username: usernameSchema.optional().or(z.literal("")),
  bio: bioSchema,
  github: urlSchema,
  twitter: twitterSchema,
  website: z
    .string()
    .max(100, "Website must be at most 100 characters")
    .optional()
    .or(z.literal("")),
});

// Group schemas
export const groupNameSchema = z
  .string()
  .min(1, "Group name is required")
  .max(50, "Group name must be at most 50 characters")
  .trim();

export const createGroupSchema = z.object({
  name: groupNameSchema,
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color format"),
});

// Bookmark schemas
export const bookmarkTitleSchema = z
  .string()
  .min(1, "Title is required")
  .max(200, "Title must be at most 200 characters")
  .trim();

export const renameBookmarkSchema = z.object({
  title: bookmarkTitleSchema,
});

export const editBookmarkSchema = z.object({
  title: bookmarkTitleSchema,
  url: z.string().url("Please enter a valid URL"),
  description: z
    .string()
    .max(150, "Description must be at most 150 characters")
    .optional(),
});

// Type exports
export type LoginFormData = z.infer<typeof loginSchema>;
export type SignupFormData = z.infer<typeof signupSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;
export type UpdateNameFormData = z.infer<typeof updateNameSchema>;
export type PublicProfileFormData = z.infer<typeof publicProfileSchema>;
export type CreateGroupFormData = z.infer<typeof createGroupSchema>;
export type RenameBookmarkFormData = z.infer<typeof renameBookmarkSchema>;
export type EditBookmarkFormData = z.infer<typeof editBookmarkSchema>;
