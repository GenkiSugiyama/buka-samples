import fastifyStatic from "@fastify/static";
import Fastify, { type FastifyInstance } from "fastify";

interface AppOptions {
  staticDirectory?: string;
}

export function createApp(options: AppOptions = {}): FastifyInstance {
  const app = Fastify({ logger: false });

  app.get("/api/health", () => ({
    service: "gmail-todo-calendar",
    status: "ok",
  }));

  if (options.staticDirectory !== undefined) {
    void app.register(fastifyStatic, {
      root: options.staticDirectory,
    });
  }

  return app;
}
