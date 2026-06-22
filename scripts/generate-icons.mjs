import sharp from 'sharp'
import { writeFile, mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = join(root, 'public')

const baseSvg = (size, safe = false) => {
  // safe=true tightens content to inner 80% for maskable variant.
  const s = size
  const m = safe ? s * 0.1 : 0
  const w = s - m * 2
  const x0 = m
  // Coordinates within the inner box (w x w)
  const barX = x0 + w * 0.23
  const barW = w * 0.4
  const barH = w * 0.08
  const barRx = w * 0.016
  const accentW = w * 0.016
  const dotR = w * 0.028
  const dotX = x0 + w * 0.73
  const y1 = x0 + w * 0.27
  const y2 = x0 + w * 0.46
  const y3 = x0 + w * 0.65
  return `<svg width="${s}" height="${s}" viewBox="0 0 ${s} ${s}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${s}" height="${s}" rx="${safe ? 0 : s * 0.19}" fill="#0a0a14"/>
  <rect x="${barX}" y="${y1}" width="${barW}" height="${barH}" rx="${barRx}" fill="#1a1f2e"/>
  <rect x="${barX}" y="${y2}" width="${barW}" height="${barH}" rx="${barRx}" fill="#1a1f2e"/>
  <rect x="${barX}" y="${y3}" width="${barW}" height="${barH}" rx="${barRx}" fill="#1a1f2e"/>
  <rect x="${barX}" y="${y1}" width="${accentW}" height="${barH}" rx="${accentW / 2}" fill="#4a9eff"/>
  <rect x="${barX}" y="${y2}" width="${accentW}" height="${barH}" rx="${accentW / 2}" fill="#4ecf7a"/>
  <rect x="${barX}" y="${y3}" width="${accentW}" height="${barH}" rx="${accentW / 2}" fill="#c47aff"/>
  <circle cx="${dotX}" cy="${y1 + barH / 2}" r="${dotR}" fill="#4a9eff"/>
  <circle cx="${dotX}" cy="${y2 + barH / 2}" r="${dotR}" fill="#4ecf7a"/>
  <circle cx="${dotX}" cy="${y3 + barH / 2}" r="${dotR}" fill="#c47aff"/>
</svg>`
}

const png = async (svg, file) => {
  const buf = await sharp(Buffer.from(svg)).png().toBuffer()
  await writeFile(join(outDir, file), buf)
  console.log('wrote', file)
}

await mkdir(outDir, { recursive: true })
await png(baseSvg(192), 'icon-192.png')
await png(baseSvg(512), 'icon-512.png')
await png(baseSvg(512, true), 'icon-512-maskable.png')
await png(baseSvg(180), 'apple-touch-icon.png')
await writeFile(join(outDir, 'icon.svg'), baseSvg(512))
console.log('done.')
