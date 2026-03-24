/**
 * Generate PWA icons using Canvas API (Node.js >= 18 with canvas or sharp).
 * Run: node generate-icons.mjs
 *
 * Requires: npm install -D sharp
 */
import sharp from 'sharp';

const sizes = [192, 512];

// Green felt background + card/chip SVG
function svgIcon(size) {
  const pad = size * 0.12;
  const inner = size - pad * 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${size * 0.2}" fill="#1a4731"/>
  <!-- Poker chip ring -->
  <circle cx="${size/2}" cy="${size/2}" r="${inner/2}" fill="none" stroke="#f0b429" stroke-width="${size*0.06}"/>
  <circle cx="${size/2}" cy="${size/2}" r="${inner/2 - size*0.1}" fill="#e63946"/>
  <!-- Card suit ♠ -->
  <text x="${size/2}" y="${size/2 + size*0.14}" font-family="Arial" font-size="${size*0.38}" fill="white" text-anchor="middle" dominant-baseline="middle">♠</text>
</svg>`;
}

for (const size of sizes) {
  await sharp(Buffer.from(svgIcon(size)))
    .png()
    .toFile(`public/icons/icon-${size}.png`);
  console.log(`Generated public/icons/icon-${size}.png`);
}
