module.exports = {
  root: true,
  env: {
    es6: true,
    node: true,
  },
  extends: [
    "eslint:recommended",
    "google",
  ],
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: "module",
  },
  rules: {
    // --- Rules explicitly turned off as per your request ---
    "quotes": "off", // Turn off "Strings must use doublequote"
    "indent": "off", // Turn off "Expected indentation of X spaces"
    // ------------------------------------------------------

    "max-len": "off", // Keep max line length off
    "object-curly-spacing": ["error", "never"], // Enforce NO space inside curly braces {key: value}
    "comma-dangle": ["error", "always-multiline"], // Enforce trailing commas for multiline items
    "prefer-const": "warn", // Change to warn, so it doesn't block if a variable is re-assigned
    "padded-blocks": "off", // Turn off for more flexibility with blank lines
    "no-useless-escape": "off", // Turn off, as it's often minor and can be annoying with prompts
    "require-jsdoc": "off", // Turn off JSDoc requirement for simplicity in this context
    "arrow-parens": ["error", "always"], // Enforce parentheses around arrow function arguments (e.g., (param) => {})
  },
};