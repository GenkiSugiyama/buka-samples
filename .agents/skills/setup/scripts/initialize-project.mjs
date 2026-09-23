#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const cwd = process.cwd();

const writeIfMissing = (relativePath, content) => {
  const filePath = join(cwd, relativePath);

  if (existsSync(filePath)) {
    console.log(`exists: ${relativePath}`);
    return;
  }

  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, `${content.trim()}\n`);
  console.log(`created: ${relativePath}`);
};

const packagePath = join(cwd, "package.json");

if (!existsSync(packagePath)) {
  execFileSync("npm", ["init", "-y"], {
    cwd,
    stdio: "inherit",
  });
}

const packageJson = JSON.parse(readFileSync(packagePath, "utf8"));

packageJson.private = true;
packageJson.type = "module";
packageJson.scripts = {
  ...packageJson.scripts,
  build: "tsc -p tsconfig.json",
  test: "vitest run --passWithNoTests",
  lint: "eslint src eslint.config.js vitest.config.ts",
  "lint:fix": "eslint src eslint.config.js vitest.config.ts --fix",
  format: "prettier . --write",
};

writeFileSync(packagePath, `${JSON.stringify(packageJson, null, 2)}\n`);
console.log("updated: package.json");

writeIfMissing(
  "tsconfig.json",
  `{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true,
    "outDir": "dist",
    "rootDir": "src",
    "types": ["node", "vitest/globals"]
  },
  "include": ["src/**/*.ts"],
  "exclude": ["dist", "node_modules", "src/**/*.test.ts", "src/**/*.spec.ts"]
}`,
);

writeIfMissing(
  "eslint.config.js",
  `import js from "@eslint/js";
import security from "eslint-plugin-security";
import tseslint from "typescript-eslint";

const globals = {
  afterEach: "readonly",
  afterAll: "readonly",
  beforeEach: "readonly",
  beforeAll: "readonly",
  Buffer: "readonly",
  clearTimeout: "readonly",
  clearInterval: "readonly",
  console: "readonly",
  describe: "readonly",
  expect: "readonly",
  fetch: "readonly",
  it: "readonly",
  process: "readonly",
  setTimeout: "readonly",
  setInterval: "readonly",
  test: "readonly",
  URL: "readonly",
  URLSearchParams: "readonly",
  vi: "readonly"
};

export default tseslint.config(
  {
    ignores: ["dist/**", "coverage/**", "node_modules/**"]
  },
  {
    languageOptions: {
      ecmaVersion: "latest",
      globals,
      sourceType: "module"
    }
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  security.configs.recommended,
  {
    rules: {
      "security/detect-non-literal-fs-filename": "off",
      "security/detect-object-injection": "off"
    }
  }
);`,
);

writeIfMissing(
  "vitest.config.ts",
  `import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true
  }
});`,
);

writeIfMissing(".prettierrc.json", "{}");
writeIfMissing(
  ".prettierignore",
  `dist
coverage
node_modules`,
);

mkdirSync(join(cwd, "src", "domain"), { recursive: true });
mkdirSync(join(cwd, "src", "services"), { recursive: true });
writeIfMissing(
  "src/index.ts",
  `// Starter file so build, test, and lint commands work before the app has features.
export {};`,
);

console.log("Project tooling is ready.");
