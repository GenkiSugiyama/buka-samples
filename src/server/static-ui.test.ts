import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { createApp } from "./app.js";

describe("GET /", () => {
  it("serves the built user interface", async () => {
    const staticDirectory = fileURLToPath(
      new URL("./test-fixtures/client", import.meta.url),
    );
    const app = createApp({ staticDirectory });

    try {
      const response = await app.inject({ method: "GET", url: "/" });

      expect(response.statusCode).toBe(200);
      expect(response.body).toContain("E2E fixture");
    } finally {
      await app.close();
    }
  });
});
