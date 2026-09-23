import { fileURLToPath } from "node:url";

import { createApp } from "./app.js";
import { startServer } from "./start.js";

const staticDirectory = fileURLToPath(
  new URL("../client", import.meta.url),
);
const app = createApp({ staticDirectory });

await startServer(app);
