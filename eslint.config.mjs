import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";

export default [
  {
    languageOptions: {
      globals: globals.node,
    }
  },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      "max-len": ["error", 120],
      "quotes": ["error", "single"],
      "no-console": "warn",
      "indent": ["error", 4],
      "semi": ["error", "always"],
      "eol-last": ["error", "always"],
      "prefer-const": "error",
    }
  }
];
