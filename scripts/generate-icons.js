/**
 * Generates all WarrantyFile icons from the Logo SVG source.
 * Outputs:
 *   public/icons/192x192.png   — PWA home screen icon
 *   public/icons/512x512.png   — PWA splash / store icon
 *   public/icons/favicon-32.png — 32px PNG favicon for modern browsers
 *   public/favicon.ico         — Browser favicon (multi-size: 16, 32, 48px)
 *
 * Run with: node scripts/generate-icons.js  (or: pnpm icons)
 * Requires: sharp (devDependency)
 *
 * Two SVG variants:
 *   ICON  — solid black bg + WF upper + thin line  → 192×192, 512×512
 *   SMALL — solid black bg + WF centered (no line) → 16/32/48 favicon
 *           (the thin line disappears at sub-32px, centered WF reads cleaner)
 */

const sharp = require('sharp')
const fs = require('fs')
const path = require('path')

// ── SVG variants ─────────────────────────────────────────────────────────────
// Keep in sync with app/components/Logo.tsx

/** Large icons: WF in upper portion + thin white line at bottom */
const SVG_ICON = (size) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <rect width="100" height="100" rx="20" ry="20" fill="#000000"/>
  <text
    x="50" y="42"
    text-anchor="middle"
    dominant-baseline="middle"
    font-family="Arial, Helvetica, sans-serif"
    font-size="38"
    font-weight="500"
    fill="#ffffff"
    letter-spacing="-0.02em"
  >WF</text>
  <line x1="12" y1="82" x2="88" y2="82" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round"/>
</svg>`

/** Small icons: WF centered on black — reads cleanly at 16/32/48px */
const SVG_SMALL = (size) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <rect width="100" height="100" rx="20" ry="20" fill="#000000"/>
  <text
    x="50" y="50"
    text-anchor="middle"
    dominant-baseline="central"
    font-family="Arial, Helvetica, sans-serif"
    font-size="44"
    font-weight="600"
    fill="#ffffff"
  >WF</text>
</svg>`

// ── ICO builder ───────────────────────────────────────────────────────────────
// Creates a valid .ico file containing multiple PNG images.
// ICO format: 6-byte header + 16-byte dir entry per image + raw PNG bytes.
function buildIco(pngBuffers, sizes) {
  const count = pngBuffers.length
  const headerSize = 6
  const dirEntrySize = 16
  const dataOffset = headerSize + dirEntrySize * count

  const offsets = []
  let currentOffset = dataOffset
  for (const buf of pngBuffers) {
    offsets.push(currentOffset)
    currentOffset += buf.length
  }

  const ico = Buffer.alloc(currentOffset)
  ico.writeUInt16LE(0, 0)
  ico.writeUInt16LE(1, 2)
  ico.writeUInt16LE(count, 4)

  for (let i = 0; i < count; i++) {
    const base = headerSize + i * dirEntrySize
    const sz = sizes[i]
    ico.writeUInt8(sz >= 256 ? 0 : sz, base)
    ico.writeUInt8(sz >= 256 ? 0 : sz, base + 1)
    ico.writeUInt8(0, base + 2)
    ico.writeUInt8(0, base + 3)
    ico.writeUInt16LE(1, base + 4)
    ico.writeUInt16LE(32, base + 6)
    ico.writeUInt32LE(pngBuffers[i].length, base + 8)
    ico.writeUInt32LE(offsets[i], base + 12)
  }

  for (let i = 0; i < count; i++) {
    pngBuffers[i].copy(ico, offsets[i])
  }

  return ico
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function generate() {
  const iconsDir = path.join(__dirname, '..', 'public', 'icons')
  const publicDir = path.join(__dirname, '..', 'public')

  if (!fs.existsSync(iconsDir)) fs.mkdirSync(iconsDir, { recursive: true })

  // PWA icons — use the full design (WF upper + line)
  for (const size of [192, 512]) {
    const outPath = path.join(iconsDir, `${size}x${size}.png`)
    await sharp(Buffer.from(SVG_ICON(size)))
      .resize(size, size)
      .png()
      .toFile(outPath)
    console.log(`✓ ${size}x${size}.png  (icon variant)`)
  }

  // Favicon ICO — use the small variant (centered WF, no line)
  const icoSizes = [16, 32, 48]
  const pngBuffers = await Promise.all(
    icoSizes.map((sz) =>
      sharp(Buffer.from(SVG_SMALL(sz))).resize(sz, sz).png().toBuffer()
    )
  )
  const icoBuffer = buildIco(pngBuffers, icoSizes)
  fs.writeFileSync(path.join(publicDir, 'favicon.ico'), icoBuffer)
  console.log(`✓ favicon.ico  (${icoSizes.join(', ')}px — small variant)`)

  // 32px PNG favicon for modern browsers — use the full design at this size
  await sharp(Buffer.from(SVG_ICON(32)))
    .resize(32, 32)
    .png()
    .toFile(path.join(iconsDir, 'favicon-32.png'))
  console.log('✓ favicon-32.png  (icon variant)')

  console.log('\nAll icons generated.')
}

generate().catch((err) => {
  console.error('Icon generation failed:', err)
  process.exit(1)
})
