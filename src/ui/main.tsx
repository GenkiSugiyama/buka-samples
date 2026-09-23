import { createRoot, type Root } from "react-dom/client";

import { App } from "./App.js";

export function mountApp(container: Element): Root {
  const root = createRoot(container);
  root.render(<App />);
  return root;
}

const container = document.getElementById("root");

if (container !== null) {
  mountApp(container);
}
