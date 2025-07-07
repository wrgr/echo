/**
 * @type {import("eslint").Linter.Config}
 */
module.exports = {
  // Specify the environment where your code will run.
  // 'browser' for client-side React code.
  // 'node' if you have server-side code or scripts that run in Node.js.
  env: {
    browser: true,
    es2022: true, // For modern JavaScript features (e.g., async/await, new syntax)
    node: true,  // For Firebase functions, build scripts, etc.
  },

  // Extend recommended configurations from ESLint and plugins.
  // 'eslint:recommended' provides a good baseline of general JavaScript rules.
  // 'plugin:react/recommended' adds React-specific linting rules.
  // 'plugin:react/jsx-runtime' is important for React 17+ using the new JSX transform.
  // If you are using TypeScript, you would add:
  // 'plugin:@typescript-eslint/recommended'
  // 'plugin:@typescript-eslint/eslint-recommended' (to disable conflicting ESLint rules)
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime', // Enables the new JSX transform
  ],

  // Configure how ESLint parses your code.
  parserOptions: {
    ecmaVersion: 'latest', // Use the latest ECMAScript version supported
    sourceType: 'module',  // Allows using ES Modules (import/export)
    ecmaFeatures: {
      jsx: true, // Enable JSX parsing
    },
    // If you are using TypeScript, you would need a TypeScript parser:
    // parser: '@typescript-eslint/parser',
    // project: './tsconfig.json', // Path to your tsconfig.json for type-aware linting
  },

  // Specify the plugins you are using.
  // These provide additional rules and configurations.
  // 'react' for React-specific rules.
  // If you are using TypeScript, you would add:
  // '@typescript-eslint'
  plugins: [
    'react',
    // '@typescript-eslint', // If using TypeScript
  ],

  // Custom rules to override or add to the extended configurations.
  // Set values to 'off', 'warn', or 'error' (0, 1, or 2).
  rules: {
    // Basic JavaScript / ESLint rules
    'no-unused-vars': 'warn',        // Warn about unused variables instead of erroring
    'indent': ['error', 2, { SwitchCase: 1 }], // Enforce 2-space indentation
    'linebreak-style': ['error', 'unix'],  // Enforce Unix-style line endings
    'quotes': ['error', 'single'],   // Enforce single quotes
    'semi': ['error', 'always'],     // Enforce semicolons at the end of statements
    'comma-dangle': ['error', 'always-multiline'], // Enforce trailing commas for multiline

    // React-specific rules
    'react/react-in-jsx-scope': 'off', // Not needed with the new JSX transform (React 17+)
    'react/prop-types': 'off',         // Disable prop-types checking (often replaced by TypeScript)
    'react/jsx-uses-react': 'off',     // Also for new JSX transform
    'react/display-name': 'off',       // Can be too strict for functional components
    'react/jsx-curly-brace-presence': ['error', { props: 'never', children: 'never' }], // Enforce consistency in JSX curly braces
    'react/function-component-definition': ['warn', { namedComponents: 'arrow-function' }], // Encourage arrow functions for named components

    // Accessibility rules (optional but recommended for a good project)
    // You might want to install `eslint-plugin-jsx-a11y` for more comprehensive a11y rules.
    // e.g., 'jsx-a11y/alt-text': 'warn',

    // TypeScript-specific rules (if you enable TypeScript)
    // '@typescript-eslint/no-unused-vars': 'warn', // Use TS-specific rule for unused vars
    // '@typescript-eslint/explicit-module-boundary-types': 'off', // Sometimes too strict for smaller projects
    // '@typescript-eslint/no-explicit-any': 'warn', // Warn about `any` type usage
  },

  // Settings for plugins.
  // This is crucial for 'plugin:react/recommended' to auto-detect your React version.
  settings: {
    react: {
      version: 'detect', // Automatically detects the React version from package.json
    },
  },

  // Optional: Overrides for specific file types or patterns.
  // For example, if you have TypeScript files:
  // overrides: [
  //   {
  //     files: ['*.ts', '*.tsx'],
  //     extends: [
  //       'plugin:@typescript-eslint/recommended',
  //       'plugin:@typescript-eslint/eslint-recommended', // Disables conflicting ESLint rules
  //     ],
  //     parserOptions: {
  //       project: './tsconfig.json', // Path to your tsconfig.json
  //     },
  //     rules: {
  //       // Add or override TypeScript-specific rules here
  //       '@typescript-eslint/explicit-module-boundary-types': 'off',
  //       '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
  //     },
  //   },
  // ],
};