import { describe, expect, it, vi } from "vitest";

import { startServer } from "./start.js";

describe("startServer", () => {
  it("listens only on the local loopback interface", async () => {
    const listen = vi.fn().mockResolvedValue("http://127.0.0.1:3000");

    await startServer({ listen });

    expect(listen).toHaveBeenCalledWith({
      host: "127.0.0.1",
      port: 3000,
    });
  });
});
