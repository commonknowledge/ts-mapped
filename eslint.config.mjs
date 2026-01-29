import { defineConfig, globalIgnores } from "eslint/config";
import unusedImports from "eslint-plugin-unused-imports";
import tseslint from "typescript-eslint";

const eslintConfig = defineConfig([
  ...tseslint.configs.strict,
  ...tseslint.configs.stylistic,
  {
    plugins: {
      "unused-imports": unusedImports,
    },
    rules: {
      "@typescript-eslint/consistent-type-imports": "error",
      "react-hooks/set-state-in-effect": "off",
      "sort-imports": [
        "error",
        {
          ignoreDeclarationSort: true,
        },
      ],
      "unused-imports/no-unused-imports": "error",
    },
  },
  globalIgnores([".next/**", ".sanity/**", "next-env.d.ts"]),
]);

export default eslintConfig;
