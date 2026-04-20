// Placeholder PNG 아이콘 생성 스크립트 (terracotta #e07a5f + white "b")
// 사용법: bun run scripts/generate-placeholder-icons.mjs
// 실제 디자인 아이콘이 나오면 이 스크립트와 산출물을 교체한다.
import sharp from 'sharp'
import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'

const outDir = resolve(process.cwd(), 'public/icons')
await mkdir(outDir, { recursive: true })

// Full-bleed: 사파리 홈스크린용 (전체 배경 terracotta)
const full = (size) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="#e07a5f"/>
  <text x="50%" y="50%" font-family="-apple-system, Pretendard, system-ui, sans-serif" font-size="${Math.round(size * 0.58)}" fill="#ffffff" text-anchor="middle" dominant-baseline="central" font-weight="700">b</text>
</svg>`

// Maskable: Android masked icons 는 가장자리가 잘림. 20% safe-zone padding.
// 외곽 padding 영역도 같은 terracotta 로 채워 crop 이 일어나도 빈 영역이 안 보이게 함.
const maskable = (size) => {
  const pad = Math.round(size * 0.1) // 10% padding on each side → 80% safe zone (guideline)
  const inner = size - pad * 2
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="#e07a5f"/>
  <text x="50%" y="50%" font-family="-apple-system, Pretendard, system-ui, sans-serif" font-size="${Math.round(inner * 0.58)}" fill="#ffffff" text-anchor="middle" dominant-baseline="central" font-weight="700">b</text>
</svg>`
}

const targets = [
  { file: 'icon-192.png', size: 192, svg: full(192) },
  { file: 'icon-512.png', size: 512, svg: full(512) },
  { file: 'icon-maskable-512.png', size: 512, svg: maskable(512) },
  { file: 'apple-touch-icon.png', size: 180, svg: full(180) },
]

for (const t of targets) {
  const out = resolve(outDir, t.file)
  await sharp(Buffer.from(t.svg)).png().toFile(out)
  console.log(`wrote ${out}`)
}
