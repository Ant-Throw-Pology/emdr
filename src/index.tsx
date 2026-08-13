if (typeof crypto.randomUUID == "undefined")
  // https://stackoverflow.com/a/2117523/2800218
  // LICENSE: https://creativecommons.org/licenses/by-sa/4.0/legalcode
  crypto.randomUUID = function randomUUID() {
    return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) =>
      (
        +c ^
        (crypto.getRandomValues(new Uint8Array(1))[0]! & (15 >> (+c / 4)))
      ).toString(16),
    ) as ReturnType<typeof crypto.randomUUID>;
  };

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./components/app";

import "./index.css";
import "./index.html" with { type: "file" };
import "./icon.svg" with { type: "file" };
import "./icon-maskable.svg" with { type: "file" };
import "./icon-192.png" with { type: "file" };
import "./icon-512.png" with { type: "file" };
import "./icon-maskable-512.png" with { type: "file" };
import "./manifest.webmanifest" with { type: "file" };

if (
  !["localhost", "127.0.0.1", "[::1]", "::1"].includes(location.hostname) &&
  "serviceWorker" in navigator
) {
  navigator.serviceWorker.register("./sw.js", {
    scope: "./",
    updateViaCache: "none",
  });
}

window.addEventListener("error", (event) => {
  alert(event.message);
});

const elem = document.getElementById("root")!;
const app = (
  <StrictMode>
    <App />
  </StrictMode>
);

if (import.meta.hot) {
  // With hot module reloading, `import.meta.hot.data` is persisted.
  const root = (import.meta.hot.data.root ??= createRoot(elem));
  root.render(app);
} else {
  // The hot module reloading API is not available in production.
  createRoot(elem).render(app);
}
