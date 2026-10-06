import js from "@eslint/js";
import ts from "typescript-eslint";
import svelte from "eslint-plugin-svelte";
import globals from "globals";
import prettier from "eslint-config-prettier";

export default ts.config(
  {
    ignores: ["dist/", "node_modules/", "legacy/", "*.cjs"],
  },

  ...svelte.configs["flat/recommended"],

  js.configs.recommended,

  {
    files: ["**/*.ts", "**/*.svelte.ts"],
    languageOptions: {
      parser: ts.parser,
      parserOptions: { ecmaVersion: "latest", sourceType: "module" },
      globals: { ...globals.browser, ...globals.node },
    },
    plugins: { "@typescript-eslint": ts.plugin },
    rules: {
      ...ts.configs.recommended.rules,
      // La regla base de ESLint no entiende las interfaces de TypeScript y
      // marca los parametros de los metodos declarados como variables sin usar.
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      // TypeScript ya avisa de simbolos no definidos. En los archivos tipados
      // esta regla produce falsos positivos con tipos como `string`.
      "no-undef": "off",
      // catalogo() arma un Map nuevo en cada llamada y nadie lo muta despues:
      // se lee, no se escribe. Svelte no necesita reactivity ahi.
      "svelte/prefer-svelte-reactivity": "off",
    },
  },

  {
    files: ["**/*.svelte"],
    languageOptions: {
      // svelte-eslint-parser parsea la plantilla, pero el bloque <script> es
      // TypeScript y se lo tiene que pasar a otro parser.
      parserOptions: {
        parser: ts.parser,
        extraFileExtensions: [".svelte"],
      },
      globals: { ...globals.browser },
    },
    rules: {
      // Con los runes de Svelte 5, lo que produce una variable `$derived` lo
      // consume el template y ESLint no lo ve. Da falsos positivos en cada
      // pantalla, asi que se desactiva para .svelte y queda para los .ts,
      // que si los revisa bien.
      "@typescript-eslint/no-unused-vars": "off",
      "no-unused-vars": "off",
    },
  },

  // Prettier va al final: desactiva las reglas de formato de ESLint para que
  // las dos herramientas no peleen por lo mismo.
  prettier,
);
