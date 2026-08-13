import fs from "fs/promises";
import path from "path";

import { Resvg } from "@resvg/resvg-js";

const SRC_DIR = path.resolve(import.meta.dir, "..", "src");

const ICONS = [
  { src: "icon.svg", out: "icon-192.png", size: 192 },
  { src: "icon.svg", out: "icon-512.png", size: 512 },
  { src: "icon-maskable.svg", out: "icon-maskable-512.png", size: 512 },
] as const;

for (const { src, out, size } of ICONS) {
  const svg = await fs.readFile(path.join(SRC_DIR, src));
  const resvg = new Resvg(svg, { fitTo: { mode: "width", value: size } });
  await fs.writeFile(path.join(SRC_DIR, out), resvg.render().asPng());
  console.log("wrote", path.join("src", out));
}
