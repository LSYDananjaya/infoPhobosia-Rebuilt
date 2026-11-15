// The files in public/assets are Figma exports that wrap a single base64 PNG,
// and most of them paint it into a rect smaller than their viewBox. This pulls
// the raster out, trims transparent padding and writes alpha WebP sprites.
import { readFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const SRC_DIR = path.resolve("public/assets");
const OUT_DIR = path.resolve("public/assets/scenes");

const MAP = {
  "Mars.svg": "mars",
  "Satellite.svg": "satellite",
  "Asteroid field.svg": "asteroid-field",
  "Orbital station.svg": "habitat-module",
  "Mars rover.svg": "mars-rover",
  "Exploration drone.svg": "exploration-drone",
  "Mars terrain.svg": "mars-terrain",
  "Astronaut.svg": "astronaut",
  "Astronaut helmet.svg": "astronaut-helmet",
};

await mkdir(OUT_DIR, { recursive: true });

const manifest = {};
for (const [file, slug] of Object.entries(MAP)) {
  const svg = await readFile(path.join(SRC_DIR, file), "utf8");
  const match = svg.match(/href="data:image\/png;base64,([^"]+)"/);
  if (!match) throw new Error(`No embedded PNG found in ${file}`);

  const png = Buffer.from(match[1], "base64");
  const { data, info } = await sharp(png)
    .trim({ threshold: 1 })
    .webp({ quality: 90, alphaQuality: 100, effort: 6 })
    .toBuffer({ resolveWithObject: true });

  await writeFile(path.join(OUT_DIR, `${slug}.webp`), data);
  manifest[slug] = { width: info.width, height: info.height, bytes: data.length };
}

console.table(manifest);
