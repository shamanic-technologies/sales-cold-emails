import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

const signInSrc = readFileSync(
  join(__dirname, "../src/components/auth/sign-in-form.tsx"),
  "utf-8"
);

const signUpSrc = readFileSync(
  join(__dirname, "../src/components/auth/sign-up-form.tsx"),
  "utf-8"
);

describe("Auth forms loading state", () => {
  for (const [name, src] of [
    ["SignInForm", signInSrc],
    ["SignUpForm", signUpSrc],
  ] as const) {
    describe(name, () => {
      it("tracks loading state with useState", () => {
        expect(src).toContain("useState(false)");
      });

      it("sets loading true before redirect", () => {
        expect(src).toContain("setLoading(true)");
      });

      it("shows spinner when loading", () => {
        expect(src).toContain("Loader2");
        expect(src).toContain("animate-spin");
      });

      it('shows "Redirecting..." text when loading', () => {
        expect(src).toContain('"Redirecting..."');
      });

      it("disables button when loading", () => {
        expect(src).toContain("disabled={!isLoaded || loading}");
      });

      it("guards handler against double-click", () => {
        expect(src).toContain("if (!isLoaded || loading) return");
      });
    });
  }
});
