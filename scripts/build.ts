import fs from "fs/promises";
import path from "path";

const PROJECT_ROOT = path.resolve(import.meta.dir, "..");
const SRC_DIR = path.resolve(PROJECT_ROOT, "src");
const BUILD_DIR = path.resolve(PROJECT_ROOT, "dist");

export interface BuildOptions {
  /** Minify the bundle. */
  minify?: boolean;
  /** Inline production env vars/defines. */
  production?: boolean;
}

export async function build(options: BuildOptions = {}) {
  const { minify = options.production ?? true, production = true } = options;

  await fs.rm(BUILD_DIR, { recursive: true, force: true });
  await fs.mkdir(BUILD_DIR, { recursive: true });

  const result = await Bun.build({
    entrypoints: [path.resolve(import.meta.dir, "..", "src", "index.tsx")],
    target: "browser",
    sourcemap: "linked",
    outdir: BUILD_DIR,
    naming: { asset: "[name].[ext]" },
    minify,
    ...(production
      ? {
          define: { "process.env.NODE_ENV": '"production"' },
          env: "BUN_PUBLIC_*",
        }
      : {}),
  });
  if (!result.success) {
    throw new Error(result.logs.map((log) => log.message).join("\n"));
  }

  const assets = (await listFiles(BUILD_DIR))
    .filter((name) => !name.endsWith(".map"))
    .sort();
  const version = await hashFiles(assets);

  const sw = await Bun.build({
    entrypoints: [path.join(SRC_DIR, "sw.ts")],
    target: "browser",
    format: "iife",
    sourcemap: "linked",
    outdir: BUILD_DIR,
    naming: { entry: "sw.js" },
    minify,
    define: {
      CACHE_NAME: JSON.stringify(`emdr-${version}`),
      PRECACHE: JSON.stringify(["./", ...assets.map((name) => `./${name}`)]),
    },
  });
  if (!sw.success) {
    throw new Error(sw.logs.map((log) => log.message).join("\n"));
  }

  console.log("Built successfully");
}

async function listFiles(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await listFiles(full)));
    else files.push(path.relative(BUILD_DIR, full));
  }
  return files;
}

async function hashFiles(files: string[]): Promise<string> {
  const hasher = new Bun.CryptoHasher("sha256");
  for (const file of files) {
    hasher.update(file);
    hasher.update("\0");
    hasher.update(await fs.readFile(path.join(BUILD_DIR, file)));
  }
  return hasher.digest("hex").slice(0, 12);
}

if (import.meta.main) {
  await build();
}
