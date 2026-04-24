import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import sharp from "sharp";

const PUBLIC_DIR = path.resolve(process.cwd(), "public");
const SOURCE = path.join(PUBLIC_DIR, "logo.png");

async function writeOptimizedLockup() {
  const trimmed = await sharp(SOURCE)
    .trim({ threshold: 10 })
    .resize({ width: 960, withoutEnlargement: true })
    .png({
      compressionLevel: 9,
      palette: true,
      quality: 85,
      effort: 10,
    })
    .toBuffer();

  const target = path.join(PUBLIC_DIR, "logo.png");
  await writeFile(target, trimmed);
  return { path: target, bytes: trimmed.length };
}

async function writeOgImage() {
  const width = 1200;
  const height = 630;

  // Full SVG composition: brand beige canvas, inline isotype matching the app logo,
  // wordmark in brand-ink, tagline in muted, subtle teal accent bar.
  const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="accent" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#0c9488" stop-opacity="0"/>
        <stop offset="50%" stop-color="#0c9488" stop-opacity="0.85"/>
        <stop offset="100%" stop-color="#0c9488" stop-opacity="0"/>
      </linearGradient>
    </defs>
    <rect width="${width}" height="${height}" fill="#f7f1e7"/>
    <rect x="0" y="${height - 4}" width="${width}" height="4" fill="url(#accent)"/>

    <!-- Isotype (scaled from 64×64 source to 200px) -->
    <g transform="translate(210 210) scale(3.125)">
      <path d="M32 6c13.807 0 25 9.551 25 21.333 0 11.783-11.193 21.334-25 21.334-2.686 0-5.277-.362-7.703-1.03L11.2 55.2a1 1 0 0 1-1.542-1.046l2.2-9.66C8.678 40.71 7 34.342 7 27.333 7 15.55 18.193 6 32 6Z"
            fill="#fffdf8" stroke="#0c9488" stroke-width="3.2" stroke-linejoin="round"/>
      <path d="M18 32a14 14 0 0 1 28 0" stroke="#0c9488" stroke-width="3" stroke-linecap="round" fill="none"/>
      <line x1="32" y1="32" x2="41" y2="22" stroke="#1b2e3c" stroke-width="2.8" stroke-linecap="round"/>
      <circle cx="32" cy="32" r="2" fill="#1b2e3c"/>
      <circle cx="23" cy="41" r="2.2" fill="#2f8457"/>
      <circle cx="32" cy="41" r="2.2" fill="#d09b4b"/>
      <circle cx="41" cy="41" r="2.2" fill="#b42318"/>
    </g>

    <!-- Wordmark -->
    <text x="445" y="355" font-family="'Public Sans', 'Segoe UI', system-ui, sans-serif"
          font-size="108" font-weight="700" fill="#1b2e3c" letter-spacing="-2">
      Estafómetro
    </text>

    <!-- Tagline -->
    <text x="${width / 2}" y="475" text-anchor="middle"
          font-family="'Public Sans', 'Segoe UI', system-ui, sans-serif"
          font-size="34" font-weight="500" fill="#17211b">
      ¿Tenés dudas sobre un mensaje?
    </text>
    <text x="${width / 2}" y="520" text-anchor="middle"
          font-family="'Public Sans', 'Segoe UI', system-ui, sans-serif"
          font-size="26" font-weight="400" fill="#5d665e">
      Revisá señales de estafa antes de pagar, responder o compartir datos.
    </text>

    <text x="${width / 2}" y="580" text-anchor="middle"
          font-family="'Public Sans', 'Segoe UI', system-ui, sans-serif"
          font-size="20" font-weight="600" fill="#0c9488" letter-spacing="4">
      GRATIS · SIN CUENTA · ORIENTATIVO
    </text>
  </svg>`;

  const output = await sharp(Buffer.from(svg))
    .png({ compressionLevel: 9, palette: true, quality: 90, effort: 10 })
    .toBuffer();

  const target = path.join(PUBLIC_DIR, "og-image.png");
  await writeFile(target, output);
  return { path: target, bytes: output.length };
}

async function main() {
  const sourceBytes = (await readFile(SOURCE)).length;
  console.log(`source logo.png: ${(sourceBytes / 1024).toFixed(1)} KB`);

  const lockup = await writeOptimizedLockup();
  console.log(`wrote ${path.basename(lockup.path)}: ${(lockup.bytes / 1024).toFixed(1)} KB`);

  const og = await writeOgImage();
  console.log(`wrote ${path.basename(og.path)}: ${(og.bytes / 1024).toFixed(1)} KB`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
