import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import tseslint from "typescript-eslint";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  {
    ignores: [".next", "src/__generated__"],
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  ...tseslint.configs.strict,
  ...tseslint.configs.stylistic,
  {
    rules: {
      // "@typescript-eslint/consistent-type-imports": "error", // TODO: re-enable when ready
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "import/order": [
        "error",
        {
          alphabetize: {
            order: "asc",
            caseInsensitive: true,
          },
          groups: [
            "builtin",
            "external",
            "internal",
            "parent",
            "sibling",
            "index",
            "object",
            "type",
          ],
        },
      ],
      // Disable resolve checking as this is handled by typescript
      "import/no-unresolved": "off",
      // Import sorting is handled by the import/order rule.
      // However, sort-imports also sorts symbols inside a multi-import
      //     e.g. import { a, b, c } from "d"
      // Setting `ignoreDeclarationSort: true` restricts it to only this behavior.
      "sort-imports": [
        "error",
        {
          ignoreDeclarationSort: true,
        },
      ],
    },
  },
];

export default eslintConfig;
