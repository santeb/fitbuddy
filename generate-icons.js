// 生成 FitBuddy PWA PNG 图标
const sharp = require('sharp');
const path = require('path');

const SIZE_192 = 192;
const SIZE_512 = 512;

const BG_COLOR = { r: 255, g: 107, b: 53 }; // #FF6B35
const BG_COLOR_END = { r: 255, g: 62, b: 127 }; // #FF3E7F
const RADIUS = 0.22; // 22% corner radius

async function generateIcon(size, filename) {
  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="${size}" height="${size}">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#FF6B35"/>
        <stop offset="100%" style="stop-color:#FF3E7F"/>
      </linearGradient>
    </defs>
    <!-- Background with rounded rect -->
    <rect width="100" height="100" rx="22" fill="url(#bg)"/>
    <!-- Dumbbell bar -->
    <rect x="18" y="46" width="64" height="8" rx="4" fill="white" opacity="0.95"/>
    <!-- Left weight plates -->
    <rect x="12" y="34" width="14" height="32" rx="3" fill="white" opacity="0.9"/>
    <rect x="26" y="38" width="6" height="24" rx="2" fill="white" opacity="0.8"/>
    <!-- Right weight plates -->
    <rect x="74" y="34" width="14" height="32" rx="3" fill="white" opacity="0.9"/>
    <rect x="68" y="38" width="6" height="24" rx="2" fill="white" opacity="0.8"/>
    <!-- Shine effect -->
    <rect x="22" y="24" width="56" height="18" rx="9" fill="white" opacity="0.12"/>
  </svg>`;

  await sharp(Buffer.from(svg))
    .png()
    .toFile(path.join(__dirname, filename));

  console.log(`✅ Generated ${filename} (${size}×${size})`);
}

async function generateMaskableIcon(size, filename) {
  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="${size}" height="${size}">
    <defs>
      <linearGradient id="bg2" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#FF6B35"/>
        <stop offset="100%" style="stop-color:#FF3E7F"/>
      </linearGradient>
    </defs>
    <!-- Full bleed background for maskable -->
    <rect width="100" height="100" fill="url(#bg2)"/>
    <!-- Center dumbbell (padded for maskable safe zone) -->
    <rect x="22" y="47" width="56" height="6" rx="3" fill="white" opacity="0.95"/>
    <rect x="14" y="36" width="12" height="28" rx="3" fill="white" opacity="0.9"/>
    <rect x="26" y="40" width="5" height="20" rx="2" fill="white" opacity="0.8"/>
    <rect x="74" y="36" width="12" height="28" rx="3" fill="white" opacity="0.9"/>
    <rect x="69" y="40" width="5" height="20" rx="2" fill="white" opacity="0.8"/>
  </svg>`;

  await sharp(Buffer.from(svg))
    .png()
    .toFile(path.join(__dirname, filename));

  console.log(`✅ Generated ${filename} (${size}×${size} maskable)`);
}

async function main() {
  await generateIcon(SIZE_192, 'icons/icon-192.png');
  await generateIcon(SIZE_512, 'icons/icon-512.png');
  await generateMaskableIcon(SIZE_512, 'icons/icon-512-maskable.png');
  console.log('🎉 All icons generated!');
}

main().catch(console.error);
