// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { App } from "./App.js";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("App", () => {
  it("shows that the browser connected to the local API", async () => {
    const response = new Response(
      JSON.stringify({ service: "gmail-todo-calendar", status: "ok" }),
      {
        headers: { "Content-Type": "application/json" },
        status: 200,
      },
    );
    vi.stubGlobal("fetch", vi.fn<typeof fetch>().mockResolvedValue(response));

    render(<App />);

    expect(
      await screen.findByText("ローカルAPIに接続しました"),
    ).toBeTruthy();
  });
});
