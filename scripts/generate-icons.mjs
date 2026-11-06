import fs from 'fs';
import path from 'path';
import { chromium } from '@playwright/test';

// SVG for standalone browser tabs and favicon (Adaptive prefers-color-scheme, transparent bg, bold glyph)
const SVG_FAVICON_ADAPTIVE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="100%" height="100%">
  <defs>
    <filter id="contrast-shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="0.5" stdDeviation="0.6" flood-color="#000000" flood-opacity="0.45"/>
    </filter>
  </defs>
  <style>
    :root {
      --primary: #15803d;
      --accent: #22c55e;
    }
    @media (prefers-color-scheme: dark) {
      :root {
        --primary: #22c55e;
        --accent: #86efac;
      }
    }
    .ring-shape { stroke: var(--primary); }
    .tick-shape { stroke: var(--primary); }
    .core-shape { fill: var(--accent); }
  </style>
  <g filter="url(#contrast-shadow)">
    <!-- Outer Target Ring -->
    <circle cx="16" cy="16" r="12.5" fill="none" stroke-width="3.2" class="ring-shape"/>
    <!-- 4 Inward Crosshair Ticks -->
    <line x1="16" y1="1" x2="16" y2="7" stroke-width="3.5" stroke-linecap="round" class="tick-shape"/>
    <line x1="16" y1="25" x2="16" y2="31" stroke-width="3.5" stroke-linecap="round" class="tick-shape"/>
    <line x1="1" y1="16" x2="7" y2="16" stroke-width="3.5" stroke-linecap="round" class="tick-shape"/>
    <line x1="25" y1="16" x2="31" y2="16" stroke-width="3.5" stroke-linecap="round" class="tick-shape"/>
    <!-- Center Keyhole Agent Core -->
    <path d="M16 10.2 a3.2 3.2 0 0 1 2.3 5.4 L19.6 21 a0.5 0.5 0 0 1 -0.5 0.6 H12.9 a0.5 0.5 0 0 1 -0.5 -0.6 L13.7 15.6 A3.2 3.2 0 0 1 16 10.2 z" class="core-shape"/>
  </g>
</svg>`;

// SVG for PNG/ICO rendering (Crisp contrast against light AND dark backgrounds)
const SVG_FOR_RENDER = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="100%" height="100%">
  <defs>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="0.5" stdDeviation="0.6" flood-color="#000000" flood-opacity="0.55"/>
    </filter>
  </defs>
  <g filter="url(#shadow)">
    <!-- Outer Ring -->
    <circle cx="16" cy="16" r="12.5" fill="none" stroke="#22c55e" stroke-width="3.2"/>
    <!-- Crosshairs -->
    <line x1="16" y1="1" x2="16" y2="7" stroke="#22c55e" stroke-width="3.5" stroke-linecap="round"/>
    <line x1="16" y1="25" x2="16" y2="31" stroke="#22c55e" stroke-width="3.5" stroke-linecap="round"/>
    <line x1="1" y1="16" x2="7" y2="16" stroke="#22c55e" stroke-width="3.5" stroke-linecap="round"/>
    <line x1="25" y1="16" x2="31" y2="16" stroke="#22c55e" stroke-width="3.5" stroke-linecap="round"/>
    <!-- Center Core Keyhole -->
    <path d="M16 10.2 a3.2 3.2 0 0 1 2.3 5.4 L19.6 21 a0.5 0.5 0 0 1 -0.5 0.6 H12.9 a0.5 0.5 0 0 1 -0.5 -0.6 L13.7 15.6 A3.2 3.2 0 0 1 16 10.2 z" fill="#86efac"/>
  </g>
</svg>`;

// Apple Touch Icon: Dark solid background with padded glyph
const SVG_APPLE_TOUCH = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 180" width="100%" height="100%">
  <rect width="180" height="180" fill="#0b0f0d"/>
  <g transform="translate(27, 27) scale(3.9375)">
    <circle cx="16" cy="16" r="12.5" fill="none" stroke="#22c55e" stroke-width="3.2"/>
    <line x1="16" y1="1" x2="16" y2="7" stroke="#22c55e" stroke-width="3.5" stroke-linecap="round"/>
    <line x1="16" y1="25" x2="16" y2="31" stroke="#22c55e" stroke-width="3.5" stroke-linecap="round"/>
    <line x1="1" y1="16" x2="7" y2="16" stroke="#22c55e" stroke-width="3.5" stroke-linecap="round"/>
    <line x1="25" y1="16" x2="31" y2="16" stroke="#22c55e" stroke-width="3.5" stroke-linecap="round"/>
    <path d="M16 10.2 a3.2 3.2 0 0 1 2.3 5.4 L19.6 21 a0.5 0.5 0 0 1 -0.5 0.6 H12.9 a0.5 0.5 0 0 1 -0.5 -0.6 L13.7 15.6 A3.2 3.2 0 0 1 16 10.2 z" fill="#86efac"/>
  </g>
</svg>`;

// Maskable Icon: Full bleed background with safe zone scaling (0.75x)
const SVG_MASKABLE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <rect width="512" height="512" fill="#0b0f0d"/>
  <g transform="translate(76.8, 76.8) scale(11.2)">
    <circle cx="16" cy="16" r="12.5" fill="none" stroke="#22c55e" stroke-width="3.2"/>
    <line x1="16" y1="1" x2="16" y2="7" stroke="#22c55e" stroke-width="3.5" stroke-linecap="round"/>
    <line x1="16" y1="25" x2="16" y2="31" stroke="#22c55e" stroke-width="3.5" stroke-linecap="round"/>
    <line x1="1" y1="16" x2="7" y2="16" stroke="#22c55e" stroke-width="3.5" stroke-linecap="round"/>
    <line x1="25" y1="16" x2="31" y2="16" stroke="#22c55e" stroke-width="3.5" stroke-linecap="round"/>
    <path d="M16 10.2 a3.2 3.2 0 0 1 2.3 5.4 L19.6 21 a0.5 0.5 0 0 1 -0.5 0.6 H12.9 a0.5 0.5 0 0 1 -0.5 -0.6 L13.7 15.6 A3.2 3.2 0 0 1 16 10.2 z" fill="#86efac"/>
  </g>
</svg>`;

function buildIco(images) {
  const count = images.length;
  const headerSize = 6;
  const dirEntrySize = 16;
  const dirSize = headerSize + count * dirEntrySize;

  let totalSize = dirSize;
  for (const img of images) {
    totalSize += img.data.length;
  }

  const buf = Buffer.alloc(totalSize);

  // ICO header
  buf.writeUInt16LE(0, 0); // reserved
  buf.writeUInt16LE(1, 2); // type 1 = icon
  buf.writeUInt16LE(count, 4); // number of images

  let currentOffset = dirSize;
  for (let i = 0; i < count; i++) {
    const img = images[i];
    const entryOffset = headerSize + i * dirEntrySize;

    buf.writeUInt8(img.width === 256 ? 0 : img.width, entryOffset);
    buf.writeUInt8(img.height === 256 ? 0 : img.height, entryOffset + 1);
    buf.writeUInt8(0, entryOffset + 2); // colors
    buf.writeUInt8(0, entryOffset + 3); // reserved
    buf.writeUInt16LE(1, entryOffset + 4); // color planes
    buf.writeUInt16LE(32, entryOffset + 6); // bpp
    buf.writeUInt32LE(img.data.length, entryOffset + 8); // size
    buf.writeUInt32LE(currentOffset, entryOffset + 12); // offset

    img.data.copy(buf, currentOffset);
    currentOffset += img.data.length;
  }

  return buf;
}

async function renderPng(browser, svgStr, size) {
  const page = await browser.newPage();
  await page.setViewportSize({ width: size, height: size });
  const html = `<!DOCTYPE html>
  <html>
    <head>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { width: ${size}px; height: ${size}px; overflow: hidden; background: transparent; display: flex; align-items: center; justify-content: center; }
        svg { width: 100%; height: 100%; display: block; }
      </style>
    </head>
    <body>
      ${svgStr}
    </body>
  </html>`;
  await page.setContent(html);
  const buffer = await page.screenshot({ omitBackground: true, type: 'png' });
  await page.close();
  return buffer;
}

async function main() {
  console.log("Launching Chromium to render crisp icon set...");
  const browser = await chromium.launch();

  const publicDir = path.resolve('public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  // 1. Write SVG icons
  console.log("Writing public/favicon.svg and src/app/icon.svg...");
  fs.writeFileSync(path.join(publicDir, 'favicon.svg'), SVG_FAVICON_ADAPTIVE.trim());
  fs.writeFileSync(path.resolve('src/app/icon.svg'), SVG_FAVICON_ADAPTIVE.trim());

  // 2. Render PNGs
  console.log("Generating apple-touch-icon.png (180x180)...");
  const p180 = await renderPng(browser, SVG_APPLE_TOUCH, 180);
  fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), p180);

  console.log("Generating icon-192.png (192x192)...");
  const p192 = await renderPng(browser, SVG_FOR_RENDER, 192);
  fs.writeFileSync(path.join(publicDir, 'icon-192.png'), p192);

  console.log("Generating icon-512.png (512x512)...");
  const p512 = await renderPng(browser, SVG_FOR_RENDER, 512);
  fs.writeFileSync(path.join(publicDir, 'icon-512.png'), p512);

  console.log("Generating icon-maskable-192.png (192x192)...");
  const pm192 = await renderPng(browser, SVG_MASKABLE, 192);
  fs.writeFileSync(path.join(publicDir, 'icon-maskable-192.png'), pm192);

  console.log("Generating icon-maskable-512.png (512x512)...");
  const pm512 = await renderPng(browser, SVG_MASKABLE, 512);
  fs.writeFileSync(path.join(publicDir, 'icon-maskable-512.png'), pm512);

  // 3. Render 16, 32, 48 for favicon.ico
  console.log("Rendering 16, 32, 48 buffers for favicon.ico...");
  const p16 = await renderPng(browser, SVG_FOR_RENDER, 16);
  const p32 = await renderPng(browser, SVG_FOR_RENDER, 32);
  const p48 = await renderPng(browser, SVG_FOR_RENDER, 48);

  const icoBuf = buildIco([
    { width: 16, height: 16, data: p16 },
    { width: 32, height: 32, data: p32 },
    { width: 48, height: 48, data: p48 },
  ]);

  console.log("Writing favicon.ico to /public and /src/app...");
  fs.writeFileSync(path.join(publicDir, 'favicon.ico'), icoBuf);
  fs.writeFileSync(path.resolve('src/app/favicon.ico'), icoBuf);

  await browser.close();
  console.log("✔ Redesigned bold transparent icon generation complete!");
}

main().catch((err) => {
  console.error("Error generating icons:", err);
  process.exit(1);
});
