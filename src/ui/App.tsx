import { useEffect, useState, type ReactElement } from "react";

type ConnectionState = "checking" | "connected" | "failed";

function getConnectionMessage(connectionState: ConnectionState): string {
  switch (connectionState) {
    case "connected":
      return "ローカルAPIに接続しました";
    case "failed":
      return "ローカルAPIに接続できませんでした";
    case "checking":
      return "ローカルAPIへの接続を確認しています…";
  }
}

export function App(): ReactElement {
  const [connectionState, setConnectionState] =
    useState<ConnectionState>("checking");

  useEffect(() => {
    const checkHealth = async (): Promise<void> => {
      try {
        const response = await fetch("/api/health");
        setConnectionState(response.ok ? "connected" : "failed");
      } catch {
        setConnectionState("failed");
      }
    };

    void checkHealth();
  }, []);

  return (
    <main>
      <h1>Gmail To-Do Calendar</h1>
      <p role="status">{getConnectionMessage(connectionState)}</p>
    </main>
  );
}
