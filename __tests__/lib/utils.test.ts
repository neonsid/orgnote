import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";

describe("cn utility function", () => {
  it("should merge tailwind classes correctly", () => {
    const result = cn("px-2", "px-4");
    expect(result).toBe("px-4");
  });

  it("should handle conditional classes", () => {
    const isActive = true;
    const result = cn("base-class", isActive && "active-class");
    expect(result).toBe("base-class active-class");
  });

  it("should handle false conditional classes", () => {
    const isActive = false;
    const result = cn("base-class", isActive && "active-class");
    expect(result).toBe("base-class");
  });

  it("should handle array of classes", () => {
    const result = cn(["class-1", "class-2"]);
    expect(result).toBe("class-1 class-2");
  });

  it("should handle object syntax", () => {
    const result = cn({ "class-1": true, "class-2": false });
    expect(result).toBe("class-1");
  });

  it("should merge multiple tailwind classes", () => {
    const result = cn("p-2 m-2", "p-4 m-4");
    expect(result).toBe("p-4 m-4");
  });

  it("should return empty string for no arguments", () => {
    const result = cn();
    expect(result).toBe("");
  });
});
