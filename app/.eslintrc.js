/** @type {import("eslint").ESLint.ConfigData} */
module.exports = {
  env: {
    browser: true,
  },
  ignorePatterns: ["dist/*"],
  overrides: [
    // TODO: include eslint for tailwindcss:
    // https://github.com/francoismassart/eslint-plugin-tailwindcss
    // doesn't work with @html-eslint/parser parser
    {
      files: "*.html",
      parser: "@html-eslint/parser",
      plugins: ["@html-eslint"],
      extends: ["plugin:@html-eslint/recommended"],
    },
    {
      files: "*.js",
      plugins: ["simple-import-sort"],
      extends: ["airbnb-base", "prettier"],
      parserOptions: {
        // support class field declarations
        ecmaVersion: "2022",
        sourceType: "module",
      },
      settings: {
        "import/resolver": {
          jsconfig: {
            config: "jsconfig.json",
          },
        },
      },
      rules: {
        "import/prefer-default-export": "off",
        "no-restricted-imports": [
          "error",
          {
            patterns: [".*"],
          },
        ],
        "no-restricted-syntax": [
          "error",
          {
            selector: "ForInStatement",
            message:
              "for..in loops iterate over the entire prototype chain, which is virtually never what you want. Use Object.{keys,values,entries}, and iterate over the resulting array.",
          },
          {
            selector: "LabeledStatement",
            message:
              "Labels are a form of GOTO; using them makes code confusing and hard to maintain and understand.",
          },
          {
            selector: "WithStatement",
            message:
              "`with` is disallowed in strict mode because it makes code impossible to predict and optimize.",
          },
        ],
        "no-plusplus": ["error", { allowForLoopAfterthoughts: true }],
        "no-param-reassign": ["error", { props: false }],
      },
    },
  ],
};
