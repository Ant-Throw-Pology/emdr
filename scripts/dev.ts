import fs from "fs/promises";
import path from "path";

import { build } from "./build";

const PROJECT_ROOT = path.resolve(import.meta.dir, "..");
const BUILD_DIR = path.resolve(PROJECT_ROOT, "dist");
const SRC_DIR = path.resolve(PROJECT_ROOT, "src");

async function runBuild() {
  try {
    await build({ minify: false, production: false });
  } catch (e) {
    console.log(e);
  }
}

await runBuild();

(async () => {
  for await (const event of fs.watch(SRC_DIR, { recursive: true })) {
    await runBuild();
  }
})();

const server = Bun.serve({
  fetch: async (request) => {
    const url = new URL(request.url);
    console.log(`${request.method} ${url.pathname}`);
    if (url.pathname == "/") url.pathname = "/index.html";
    const file = Bun.file(path.join(BUILD_DIR, url.pathname));
    if (!(await file.exists()))
      return new Response(null, {
        status: 404,
      });
    return new Response(file);
  },
});

console.log(`Application is running at http://localhost:${server.port}`);
