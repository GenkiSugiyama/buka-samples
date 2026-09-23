// @vitest-environment jsdom

import { act } from "react";
import { screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { mountApp } from "./main.js";

afterEach(() => {
  document.body.replaceChildren();
  vi.unstubAllGlobals();
});

describe("mountApp", () => {
  it("mounts the application in the provided element", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn<typeof fetch>()
        .mockResolvedValue(new Response(null, { status: 200 })),
    );
    const container = document.createElement("div");
    document.body.append(container);

    const root = mountApp(container);

    expect(
      await screen.findByRole("heading", { name: "Gmail To-Do Calendar" }),
    ).toBeTruthy();
    act(() => {
      root.unmount();
    });
  });
});
