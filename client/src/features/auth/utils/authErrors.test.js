import { describe, expect, it } from "vitest";
import { getAuthErrorMessage } from "./authErrors";

describe("getAuthErrorMessage", () => {
  it("maps known Firebase codes", () => {
    expect(getAuthErrorMessage({ code: "auth/invalid-credential" })).toBe(
      "Incorrect email or password.",
    );
  });

  it("maps popup cancellation", () => {
    expect(getAuthErrorMessage({ code: "auth/popup-closed-by-user" })).toContain(
      "popup was closed",
    );
  });

  it("falls back to the error message", () => {
    expect(getAuthErrorMessage(new Error("Backend unavailable."))).toBe(
      "Backend unavailable.",
    );
  });

  it("handles missing errors", () => {
    expect(getAuthErrorMessage(null)).toBe("Something went wrong. Please try again.");
  });
});
