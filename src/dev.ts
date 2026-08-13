import fs from "fs/promises";
import path from "path";

const PROJECT_ROOT = path.resolve(import.meta.dir, "..");
const BUILD_DIR = path.resolve(PROJECT_ROOT, "dist");
const SRC_DIR = path.resolve(PROJECT_ROOT, "src");

await fs.rm(BUILD_DIR, { recursive: true, force: true });
await fs.mkdir(BUILD_DIR);

async function runBuild() {
  // bun build src/index.tsx --target=browser --sourcemap=linked --outdir=dist --asset-naming='[name].[ext]'
  await Bun.build({
    entrypoints: [path.resolve(import.meta.dir, "index.tsx")],
    target: "browser",
    sourcemap: "linked",
    outdir: BUILD_DIR,
    naming: { asset: "[name].[ext]" },
  });
  console.log("Built successfully");
}

await runBuild();

(async () => {
  for await (const event of fs.watch(SRC_DIR, { recursive: true })) {
    try {
      await runBuild();
    } catch (e) {
      console.log(e);
    }
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
