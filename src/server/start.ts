interface ServerListener {
  listen(options: { host: string; port: number }): Promise<string>;
}

export async function startServer(
  server: ServerListener,
  port = 3000,
): Promise<string> {
  return server.listen({
    host: "127.0.0.1",
    port,
  });
}
