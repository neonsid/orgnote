import { describe, it, expect } from "vitest";
import { extractDomain, COLORS } from "@/lib/domain-utils";

describe("extractDomain", () => {
  it("should extract domain from full URL with protocol", () => {
    expect(extractDomain("https://www.example.com/path")).toBe("example.com");
  });

  it("should extract domain from URL without www", () => {
    expect(extractDomain("https://example.com")).toBe("example.com");
  });

  it("should extract domain from URL without protocol", () => {
    expect(extractDomain("www.example.com")).toBe("example.com");
  });

  it("should extract domain from URL with just domain", () => {
    expect(extractDomain("example.com")).toBe("example.com");
  });

  it("should return empty string for invalid URL", () => {
    expect(extractDomain("not a valid url")).toBe("");
  });

  it("should extract domain from URL with subdomain", () => {
    expect(extractDomain("https://blog.example.com")).toBe("blog.example.com");
  });

  it("should handle empty string", () => {
    expect(extractDomain("")).toBe("");
  });
});

describe("COLORS constant", () => {
  it("should have 8 colors", () => {
    expect(COLORS).toHaveLength(8);
  });

  it("should contain valid hex colors", () => {
    const hexRegex = /^#[0-9A-Fa-f]{6}$/;
    COLORS.forEach((color) => {
      expect(color).toMatch(hexRegex);
    });
  });
});
