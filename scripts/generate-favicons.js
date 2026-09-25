const fs = require('fs');
const path = require('path');
const React = require('react');
const { ImageResponse } = require('next/og');

// 1. Official Mitkablim Academic Graduation Cap SVG Definition
const svgString = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48" height="48" fill="none">
  <defs>
    <linearGradient id="mitkablimTassel" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#0284c7" />
      <stop offset="100%" stop-color="#06b6d4" />
    </linearGradient>
    <filter id="subtleRim" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="0.5" stdDeviation="0.5" flood-color="#000000" flood-opacity="0.3" />
    </filter>
  </defs>

  <!-- Skullcap / Headpiece under the mortarboard -->
  <path
    d="M 13 22.5 V 30 C 13 36 18 39.5 24 39.5 C 30 39.5 35 36 35 30 V 22.5 C 31.5 25.5 27.5 27 24 27 C 20.5 27 16.5 25.5 13 22.5 Z"
    fill="#18181b"
    stroke="#2d2d32"
    stroke-width="0.6"
  />

  <!-- Mortarboard 3D Rim / Underside Depth -->
  <path
    d="M 4 19 L 24 29 L 44 19 L 44 21.5 L 24 31.5 L 4 21.5 Z"
    fill="#141416"
  />

  <!-- White accent rim band (crisp separation between plate and base) -->
  <path
    d="M 4 17 L 24 27 L 44 17 L 44 19.5 L 24 29.5 L 4 19.5 Z"
    fill="#ffffff"
  />

  <!-- Mortarboard Top Diamond Plate -->
  <path
    d="M 24 7 L 44 17 L 24 27 L 4 17 Z"
    fill="#222226"
    stroke="#38383f"
    stroke-width="0.6"
  />

  <!-- Silk Ribbon Cord draping gracefully to the side -->
  <path
    d="M 24 17 C 33 17 40 21 40 26 V 35"
    stroke="url(#mitkablimTassel)"
    stroke-width="2.6"
    stroke-linecap="round"
  />

  <!-- Academic Tassel Brush / Fringe -->
  <path
    d="M 37.5 35 H 42.5 L 43.5 42 C 43.5 42.5 43 43 42 43 H 38 C 37 43 36.5 42.5 36.5 42 L 37.5 35 Z"
    fill="url(#mitkablimTassel)"
  />

  <!-- Center Academic Stud (Matches Brand Cyan Dot) -->
  <circle cx="24" cy="17" r="2.6" fill="#00d8f6" />
</svg>`;

// Helper to create React element tree for ImageResponse
function createCapElement(size) {
  return React.createElement('div', {
    style: {
      width: '100%',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'transparent',
    }
  }, [
    React.createElement('svg', {
      key: 'svg',
      width: size,
      height: size,
      viewBox: '0 0 48 48',
      fill: 'none',
      xmlns: 'http://www.w3.org/2000/svg'
    }, [
      React.createElement('defs', { key: 'defs' }, [
        React.createElement('linearGradient', {
          key: 'grad',
          id: 'tassel',
          x1: '0%',
          y1: '0%',
          x2: '0%',
          y2: '100%'
        }, [
          React.createElement('stop', { key: 's1', offset: '0%', stopColor: '#0284c7' }),
          React.createElement('stop', { key: 's2', offset: '100%', stopColor: '#06b6d4' })
        ])
      ]),
      // Skullcap
      React.createElement('path', {
        key: 'skull',
        d: 'M 13 22.5 V 30 C 13 36 18 39.5 24 39.5 C 30 39.5 35 36 35 30 V 22.5 C 31.5 25.5 27.5 27 24 27 C 20.5 27 16.5 25.5 13 22.5 Z',
        fill: '#18181b',
        stroke: '#2d2d32',
        strokeWidth: 0.6
      }),
      // 3D Rim
      React.createElement('path', {
        key: 'rim',
        d: 'M 4 19 L 24 29 L 44 19 L 44 21.5 L 24 31.5 L 4 21.5 Z',
        fill: '#141416'
      }),
      // White accent rim
      React.createElement('path', {
        key: 'white-rim',
        d: 'M 4 17 L 24 27 L 44 17 L 44 19.5 L 24 29.5 L 4 19.5 Z',
        fill: '#ffffff'
      }),
      // Top Diamond Plate
      React.createElement('path', {
        key: 'plate',
        d: 'M 24 7 L 44 17 L 24 27 L 4 17 Z',
        fill: '#222226',
        stroke: '#38383f',
        strokeWidth: 0.6
      }),
      // Cord
      React.createElement('path', {
        key: 'cord',
        d: 'M 24 17 C 33 17 40 21 40 26 V 35',
        stroke: '#0284c7',
        strokeWidth: 2.6,
        strokeLinecap: 'round'
      }),
      // Tassel Brush
      React.createElement('path', {
        key: 'brush',
        d: 'M 37.5 35 H 42.5 L 43.5 42 C 43.5 42.5 43 43 42 43 H 38 C 37 43 36.5 42.5 36.5 42 L 37.5 35 Z',
        fill: '#06b6d4'
      }),
      // Center Stud
      React.createElement('circle', {
        key: 'stud',
        cx: 24,
        cy: 17,
        r: 2.6,
        fill: '#00d8f6'
      })
    ])
  ]);
}

// Helper to create a valid multi-resolution ICO file
function createIco(images) {
  const count = images.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: 1 = ICO
  header.writeUInt16LE(count, 4); // count

  let offset = 6 + count * 16;
  const entries = [];
  for (const img of images) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(img.width >= 256 ? 0 : img.width, 0);
    entry.writeUInt8(img.height >= 256 ? 0 : img.height, 1);
    entry.writeUInt8(0, 2); // color count
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // color planes
    entry.writeUInt16LE(32, 6); // bpp
    entry.writeUInt32LE(img.buffer.length, 8); // size
    entry.writeUInt32LE(offset, 12); // offset
    entries.push(entry);
    offset += img.buffer.length;
  }

  return Buffer.concat([header, ...entries, ...images.map(img => img.buffer)]);
}

async function generate() {
  console.log('Generating Mitkablim Graduation Cap Favicons...');

  const rootDir = path.resolve(__dirname, '..');
  const publicDir = path.join(rootDir, 'public');
  const appDir = path.join(rootDir, 'src', 'app');

  // 1. Write SVG icons
  fs.writeFileSync(path.join(publicDir, 'icon.svg'), svgString, 'utf8');
  fs.writeFileSync(path.join(appDir, 'icon.svg'), svgString, 'utf8');
  console.log('✓ Written icon.svg to public/ and src/app/');

  // 2. Generate PNGs at required resolutions
  const sizes = [16, 32, 48, 96, 180, 192, 512];
  const pngBuffers = {};

  for (const size of sizes) {
    const elem = createCapElement(size);
    const res = new ImageResponse(elem, { width: size, height: size });
    const ab = await res.arrayBuffer();
    const buf = Buffer.from(ab);
    pngBuffers[size] = buf;

    if (size === 48) {
      fs.writeFileSync(path.join(publicDir, 'icon-48x48.png'), buf);
    } else if (size === 96) {
      fs.writeFileSync(path.join(publicDir, 'icon-96x96.png'), buf);
    } else if (size === 180) {
      fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), buf);
    } else if (size === 192) {
      fs.writeFileSync(path.join(publicDir, 'icon-192x192.png'), buf);
    } else if (size === 512) {
      fs.writeFileSync(path.join(publicDir, 'icon-512x512.png'), buf);
    }
    console.log(`✓ Generated ${size}x${size} PNG (${buf.length} bytes)`);
  }

  // 3. Create ICO container containing 16x16, 32x32, 48x48
  const icoBuffer = createIco([
    { width: 16, height: 16, buffer: pngBuffers[16] },
    { width: 32, height: 32, buffer: pngBuffers[32] },
    { width: 48, height: 48, buffer: pngBuffers[48] }
  ]);

  fs.writeFileSync(path.join(publicDir, 'favicon.ico'), icoBuffer);
  fs.writeFileSync(path.join(appDir, 'favicon.ico'), icoBuffer);
  console.log(`✓ Written multi-resolution favicon.ico to public/ and src/app/ (${icoBuffer.length} bytes)`);

  console.log('All favicons successfully generated!');
}

generate().catch(err => {
  console.error('Generation failed:', err);
  process.exit(1);
});
