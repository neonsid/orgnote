import { describe, it, expect } from "vitest";
import {
  loginSchema,
  signupSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  createGroupSchema,
  publicProfileSchema,
} from "@/lib/validation";

describe("loginSchema", () => {
  it("should validate correct email and password", () => {
    const result = loginSchema.safeParse({
      email: "user@example.com",
      password: "password123",
    });
    expect(result.success).toBe(true);
  });

  it("should fail with invalid email", () => {
    const result = loginSchema.safeParse({
      email: "invalid-email",
      password: "password123",
    });
    expect(result.success).toBe(false);
  });

  it("should fail with short password", () => {
    const result = loginSchema.safeParse({
      email: "user@example.com",
      password: "short",
    });
    expect(result.success).toBe(false);
  });

  it("should convert email to lowercase", () => {
    const result = loginSchema.parse({
      email: "USER@EXAMPLE.COM",
      password: "password123",
    });
    expect(result.email).toBe("user@example.com");
  });
});

describe("signupSchema", () => {
  it("should validate valid signup data", () => {
    const result = signupSchema.safeParse({
      name: "John Doe",
      email: "john@example.com",
      password: "Password123!",
      confirmPassword: "Password123!",
    });
    expect(result.success).toBe(true);
  });

  it("should fail when passwords do not match", () => {
    const result = signupSchema.safeParse({
      name: "John Doe",
      email: "john@example.com",
      password: "Password123!",
      confirmPassword: "DifferentPassword123!",
    });
    expect(result.success).toBe(false);
  });

  it("should fail with weak password (no uppercase)", () => {
    const result = signupSchema.safeParse({
      name: "John Doe",
      email: "john@example.com",
      password: "password123!",
      confirmPassword: "password123!",
    });
    expect(result.success).toBe(false);
  });

  it("should fail with short name", () => {
    const result = signupSchema.safeParse({
      name: "J",
      email: "john@example.com",
      password: "Password123!",
      confirmPassword: "Password123!",
    });
    expect(result.success).toBe(false);
  });
});

describe("forgotPasswordSchema", () => {
  it("should validate valid email", () => {
    const result = forgotPasswordSchema.safeParse({
      email: "user@example.com",
    });
    expect(result.success).toBe(true);
  });

  it("should fail with invalid email", () => {
    const result = forgotPasswordSchema.safeParse({
      email: "invalid-email",
    });
    expect(result.success).toBe(false);
  });
});

describe("resetPasswordSchema", () => {
  it("should validate matching passwords", () => {
    const result = resetPasswordSchema.safeParse({
      password: "NewPassword123!",
      confirmPassword: "NewPassword123!",
    });
    expect(result.success).toBe(true);
  });

  it("should fail when passwords do not match", () => {
    const result = resetPasswordSchema.safeParse({
      password: "NewPassword123!",
      confirmPassword: "DifferentPassword123!",
    });
    expect(result.success).toBe(false);
  });
});

describe("createGroupSchema", () => {
  it("should validate valid group data", () => {
    const result = createGroupSchema.safeParse({
      name: "My Group",
      color: "#3b82f6",
    });
    expect(result.success).toBe(true);
  });

  it("should fail with empty name", () => {
    const result = createGroupSchema.safeParse({
      name: "",
      color: "#3b82f6",
    });
    expect(result.success).toBe(false);
  });

  it("should fail with invalid color format", () => {
    const result = createGroupSchema.safeParse({
      name: "My Group",
      color: "blue",
    });
    expect(result.success).toBe(false);
  });

  it("should fail with short color hex", () => {
    const result = createGroupSchema.safeParse({
      name: "My Group",
      color: "#3b8",
    });
    expect(result.success).toBe(false);
  });
});

describe("publicProfileSchema", () => {
  it("should validate valid public profile", () => {
    const result = publicProfileSchema.safeParse({
      isPublic: true,
      username: "johndoe",
      bio: "Hello world",
      github: "https://github.com/johndoe",
      twitter: "johndoe",
      website: "https://johndoe.com",
    });
    expect(result.success).toBe(true);
  });

  it("should validate with minimal data", () => {
    const result = publicProfileSchema.safeParse({
      isPublic: false,
    });
    expect(result.success).toBe(true);
  });

  it("should fail with invalid username characters", () => {
    const result = publicProfileSchema.safeParse({
      isPublic: true,
      username: "john@doe",
    });
    expect(result.success).toBe(false);
  });

  it("should fail with short username", () => {
    const result = publicProfileSchema.safeParse({
      isPublic: true,
      username: "ab",
    });
    expect(result.success).toBe(false);
  });
});
