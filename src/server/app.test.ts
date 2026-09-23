import { describe, expect, it } from "vitest";

import { createApp } from "./app.js";

describe("GET /api/health", () => {
  it("returns the service health for a local client", async () => {
    const app = createApp();

    try {
      const response = await app.inject({
        method: "GET",
        url: "/api/health",
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({
        service: "gmail-todo-calendar",
        status: "ok",
      });
    } finally {
      await app.close();
    }
  });
});
