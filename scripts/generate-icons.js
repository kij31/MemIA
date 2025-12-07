import { PNG } from 'pngjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create a gradient PNG icon with heart
function createIcon(size) {
  const png = new PNG({ width: size, height: size });

  // Colors
  const purpleStart = { r: 168, g: 85, b: 247 }; // #a855f7
  const pinkEnd = { r: 236, g: 72, b: 153 };    // #ec4899

  // Draw gradient background
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (size * y + x) << 2;

      // Calculate gradient position (diagonal)
      const gradientPos = (x + y) / (2 * size);

      // Interpolate colors
      png.data[idx] = Math.round(purpleStart.r + (pinkEnd.r - purpleStart.r) * gradientPos);
      png.data[idx + 1] = Math.round(purpleStart.g + (pinkEnd.g - purpleStart.g) * gradientPos);
      png.data[idx + 2] = Math.round(purpleStart.b + (pinkEnd.b - purpleStart.b) * gradientPos);
      png.data[idx + 3] = 255; // Alpha
    }
  }

  // Draw a simple white heart shape
  const centerX = size / 2;
  const centerY = size / 2;
  const heartSize = size * 0.5;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = x - centerX;
      const dy = y - centerY;

      // Simple heart equation: ((x/a)^2 + (y/a)^2 - 1)^3 - (x/a)^2 * (y/a)^3 = 0
      // Simplified version for a recognizable heart shape
      const a = heartSize / 2;
      const normalizedX = dx / a;
      const normalizedY = (dy / a) - 0.3; // Offset up a bit

      const heartEq = Math.pow(normalizedX * normalizedX + normalizedY * normalizedY - 1, 3) -
                      normalizedX * normalizedX * normalizedY * normalizedY * normalizedY;

      if (heartEq < 0) {
        const idx = (size * y + x) << 2;
        png.data[idx] = 255;     // R - white
        png.data[idx + 1] = 255; // G
        png.data[idx + 2] = 255; // B
        png.data[idx + 3] = 255; // A
      }
    }
  }

  return png;
}

// Generate icons
const sizes = [
  { size: 192, name: 'icon-192x192.png' },
  { size: 512, name: 'icon-512x512.png' },
  { size: 180, name: 'apple-touch-icon.png' }
];

const iconsDir = path.join(__dirname, '../public/icons');

// Create icons directory if it doesn't exist
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

sizes.forEach(({ size, name }) => {
  console.log(`Generating ${name} (${size}x${size})...`);
  const icon = createIcon(size);
  const outputPath = path.join(iconsDir, name);

  icon.pack().pipe(fs.createWriteStream(outputPath));
  console.log(`✓ ${name} created`);
});

console.log('\nAll icons generated successfully!');
