const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const assetsDir = path.join(__dirname, 'assets');

// Forest theme colors
const colors = {
  primary100: '#0B1E14',
  primary90: '#122D1F',
  primary80: '#1B4332',
  primary60: '#2E6B4F',
  primary40: '#60A882',
  primary20: '#A8D4BC',
  primary10: '#D8EEE2',
  primary5: '#EEF7F1',
  accent: '#DCBD74',
  accentB: '#E18C70',
  accentC: '#7EC8B0',
};

async function generateGradient(filename, color1, color2, angle = '135') {
  let gradientDef;
  if (angle === '135') {
    gradientDef = `x1="0%" y1="0%" x2="100%" y2="100%"`;
  } else if (angle === '180') {
    gradientDef = `x1="0%" y1="0%" x2="0%" y2="100%"`;
  } else if (angle === '90') {
    gradientDef = `x1="0%" y1="0%" x2="100%" y2="0%"`;
  } else {
    gradientDef = `x1="0%" y1="0%" x2="100%" y2="100%"`;
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1440" height="810">
    <defs><linearGradient id="g" ${gradientDef}>
      <stop offset="0%" style="stop-color:${color1}"/>
      <stop offset="100%" style="stop-color:${color2}"/>
    </linearGradient></defs>
    <rect width="100%" height="100%" fill="url(#g)"/>
  </svg>`;
  await sharp(Buffer.from(svg)).png().toFile(path.join(assetsDir, filename));
}

// Generate icon PNG from SVG (unused but kept for future use)
async function generateIcon(filename, iconSvg, size = 64, bgColor = null, fgColor = '#DCBD74') {
  const baseSize = iconSvg.size || 24;
  const scale = size * 0.6 / baseSize;
  let content;
  if (bgColor) {
    content = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
      <rect width="${size}" height="${size}" rx="12" fill="${bgColor}"/>
      <g transform="translate(${size*0.2}, ${size*0.2}) scale(${scale})">${iconSvg.path}</g>
    </svg>`;
  } else {
    content = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${baseSize} ${baseSize}">
      <path d="${iconSvg.path}" fill="${fgColor}"/>
    </svg>`;
  }
  await sharp(Buffer.from(content)).png().toFile(path.join(assetsDir, filename));
}

async function main() {
  // 1. Cover background - dark gradient
  await generateGradient('cover-bg.png', colors.primary100, colors.primary90, '135');

  // 2. Light surface gradient
  await generateGradient('surface-bg.png', '#FFFFFF', colors.primary5, '180');

  // 3. Dark accent gradient for divider/closing
  await generateGradient('dark-accent-bg.png', colors.primary90, colors.primary80, '135');

  // 4. Mint accent gradient
  await generateGradient('mint-gradient.png', colors.primary80, colors.primary60, '90');

  // 5. Generate simple icon backgrounds (colored circles with symbols)
  const iconConfigs = [
    { name: 'icon-student.png', symbol: '🎓', bg: colors.primary10 },
    { name: 'icon-teacher.png', symbol: '👨‍🏫', bg: colors.primary10 },
    { name: 'icon-subject.png', symbol: '📚', bg: colors.primary10 },
    { name: 'icon-qr.png', symbol: '📱', bg: colors.primary10 },
    { name: 'icon-report.png', symbol: '📊', bg: colors.primary10 },
    { name: 'icon-lock.png', symbol: '🔒', bg: colors.primary10 },
    { name: 'icon-role-admin.png', symbol: '👑', bg: colors.primary10 },
    { name: 'icon-role-assist.png', symbol: '🤝', bg: colors.primary10 },
    { name: 'icon-role-reg.png', symbol: '📝', bg: colors.primary10 },
    { name: 'icon-role-gate.png', symbol: '🚪', bg: colors.primary10 },
    { name: 'icon-role-teacher.png', symbol: '✏️', bg: colors.primary10 },
    { name: 'icon-role-parent.png', symbol: '👨‍👧', bg: colors.primary10 },
    { name: 'icon-role-student.png', symbol: '🎒', bg: colors.primary10 },
    { name: 'icon-role-sysadmin.png', symbol: '⚙️', bg: colors.primary10 },
  ];

  // Generate icon placeholder images with colored backgrounds
  for (const cfg of iconConfigs) {
    const size = 64;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
      <rect width="${size}" height="${size}" rx="12" fill="${cfg.bg}"/>
      <text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" font-size="32">${cfg.symbol}</text>
    </svg>`;
    await sharp(Buffer.from(svg)).png().toFile(path.join(assetsDir, cfg.name));
  }

  // Generate decorative elements
  // Accent dot
  const dotSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20">
    <circle cx="10" cy="10" r="10" fill="${colors.accent}"/>
  </svg>`;
  await sharp(Buffer.from(dotSvg)).png().toFile(path.join(assetsDir, 'accent-dot.png'));

  // Decorative shape - bottom right corner for cover
  const cornerSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">
    <polygon points="200,0 200,200 0,200" fill="${colors.accent}" opacity="0.15"/>
  </svg>`;
  await sharp(Buffer.from(cornerSvg)).png().toFile(path.join(assetsDir, 'corner-accent.png'));

  // Technology stack logos as simple colored boxes with text
  const techIcons = [
    { name: 'tech-nextjs.png', label: 'N', bg: '#000000', fg: '#FFFFFF' },
    { name: 'tech-ts.png', label: 'TS', bg: '#3178C6', fg: '#FFFFFF' },
    { name: 'tech-prisma.png', label: 'P', bg: colors.primary80, fg: '#FFFFFF' },
    { name: 'tech-tailwind.png', label: 'TW', bg: '#06B6D4', fg: '#FFFFFF' },
    { name: 'tech-shadcn.png', label: 'S', bg: colors.primary90, fg: '#FFFFFF' },
    { name: 'tech-qr.png', label: 'QR', bg: colors.accent, fg: colors.primary90 },
  ];

  for (const t of techIcons) {
    const size = 48;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
      <rect width="${size}" height="${size}" rx="8" fill="${t.bg}"/>
      <text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" font-size="18" font-weight="bold" fill="${t.fg}">${t.label}</text>
    </svg>`;
    await sharp(Buffer.from(svg)).png().toFile(path.join(assetsDir, t.name));
  }

  console.log('All assets generated successfully!');
}

main().catch(console.error);
