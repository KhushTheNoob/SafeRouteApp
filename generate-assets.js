const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const assetsDir = path.join(__dirname, 'assets');

// Ensure assets directory exists
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir);
}

// SafeRoute brand color
const backgroundColor = { r: 10, g: 22, b: 40, alpha: 1 }; // #0A1628
const accentColor = { r: 34, g: 197, b: 94, alpha: 1 }; // #22C55E (green)

async function createIcon() {
  // Create a 1024x1024 icon with a simple shield design
  const svg = `
    <svg width="1024" height="1024" xmlns="http://www.w3.org/2000/svg">
      <rect width="1024" height="1024" fill="#0A1628"/>
      <path d="M512 100 L812 250 L812 550 Q812 750 512 924 Q212 750 212 550 L212 250 Z" 
            fill="#1E3A5F" stroke="#22C55E" stroke-width="20"/>
      <path d="M462 500 L512 550 L612 400" 
            stroke="#22C55E" stroke-width="60" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `;
  
  await sharp(Buffer.from(svg))
    .png()
    .toFile(path.join(assetsDir, 'icon.png'));
  
  console.log('Created icon.png');
}

async function createAdaptiveIcon() {
  // Create a 1024x1024 adaptive icon (foreground only, transparent bg)
  const svg = `
    <svg width="1024" height="1024" xmlns="http://www.w3.org/2000/svg">
      <rect width="1024" height="1024" fill="#0A1628"/>
      <path d="M512 150 L762 275 L762 525 Q762 700 512 849 Q262 700 262 525 L262 275 Z" 
            fill="#1E3A5F" stroke="#22C55E" stroke-width="16"/>
      <path d="M462 475 L512 525 L612 375" 
            stroke="#22C55E" stroke-width="50" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `;
  
  await sharp(Buffer.from(svg))
    .png()
    .toFile(path.join(assetsDir, 'adaptive-icon.png'));
  
  console.log('Created adaptive-icon.png');
}

async function createSplash() {
  // Create a 1284x2778 splash screen (iPhone 14 Pro Max size)
  const svg = `
    <svg width="1284" height="2778" xmlns="http://www.w3.org/2000/svg">
      <rect width="1284" height="2778" fill="#0A1628"/>
      <g transform="translate(392, 1089)">
        <path d="M250 50 L450 150 L450 350 Q450 500 250 612 Q50 500 50 350 L50 150 Z" 
              fill="#1E3A5F" stroke="#22C55E" stroke-width="12"/>
        <path d="M210 310 L250 350 L330 240" 
              stroke="#22C55E" stroke-width="36" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
      </g>
      <text x="642" y="1850" text-anchor="middle" font-family="Arial, sans-serif" font-size="72" font-weight="bold" fill="#FFFFFF">SafeRoute</text>
      <text x="642" y="1930" text-anchor="middle" font-family="Arial, sans-serif" font-size="36" fill="#94A3B8">Walk safely at night</text>
    </svg>
  `;
  
  await sharp(Buffer.from(svg))
    .png()
    .toFile(path.join(assetsDir, 'splash.png'));
  
  console.log('Created splash.png');
}

async function createFavicon() {
  // Create a 48x48 favicon
  const svg = `
    <svg width="48" height="48" xmlns="http://www.w3.org/2000/svg">
      <rect width="48" height="48" fill="#0A1628" rx="8"/>
      <path d="M24 6 L40 14 L40 28 Q40 38 24 46 Q8 38 8 28 L8 14 Z" 
            fill="#1E3A5F" stroke="#22C55E" stroke-width="2"/>
      <path d="M19 25 L24 30 L32 19" 
            stroke="#22C55E" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `;
  
  await sharp(Buffer.from(svg))
    .png()
    .toFile(path.join(assetsDir, 'favicon.png'));
  
  console.log('Created favicon.png');
}

async function main() {
  try {
    await createIcon();
    await createAdaptiveIcon();
    await createSplash();
    await createFavicon();
    console.log('\nAll assets created successfully!');
  } catch (error) {
    console.error('Error creating assets:', error);
  }
}

main();
