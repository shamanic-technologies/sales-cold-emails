import { defineConfig, globalIgnores } from "eslint/config";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";

// eslint-config-next was dropped: its @next/eslint-plugin-next pins fast-glob 3.3.1,
// which pulls micromatch > braces (high advisory, no patched release).
const eslintConfig = defineConfig([
  ...tseslint.configs.recommended,
  reactHooks.configs.flat["recommended-latest"],
  { rules: { "@typescript-eslint/no-unused-vars": "warn" } },
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
]);

export default eslintConfig;
