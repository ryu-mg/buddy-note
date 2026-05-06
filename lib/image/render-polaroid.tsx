import 'server-only'

import { Resvg } from '@resvg/resvg-js'
import satori from 'satori'

import { loadFonts } from '@/lib/image/fonts'
import { resolveThemePreset } from '@/lib/themes/presets'

/**
 * Polaroid composite renderer.
 *
 * Per AGENTS.md / DESIGN §12:
 *   - 24px white border around photo (bottom 44px caption area)
 *   - -1.2deg tilt
 *   - MaruBuri for diary body, Pretendard SemiBold for title
 *   - Terracotta accent (var(--color-accent-brand) = #e07a5f) used ONLY
 *     as a small decorative dot beside the title — never dominant.
 *   - 5% grain: see note at bottom of this file. satori does NOT support
 *     SVG filters (turbulence) and has no real noise primitive. We
 *     approximate with a very low-opacity radial gradient overlay; real
 *     turbulence grain is deferred to post-process resvg stage or v1.5.
 *
 * Colour values are hex literals (not CSS vars) because satori does NOT
 * resolve `var(...)` — tokens are resolved once here.
 *
 * All 3 share ratios are 1080 wide:
 *   9:16  →  1080 x 1920  (Instagram Story)
 *   4:5   →  1080 x 1350  (Instagram feed)
 *   1:1   →  1080 x 1080  (square)
 */

const COLOR_PAPER = '#ffffff' // 폴라로이드 카드 흰 테두리
const COLOR_INK = '#1a1a1a' // 본문
const COLOR_INK_SOFT = '#3f3f3f' // diary 본문 subtle

type Format = '9:16' | '4:5' | '1:1'

type RenderArgs = {
  photoUrl?: string | null
  petName: string
  diaryTitle: string
  diaryBody: string
  format: Format
  themeKey?: string | null
}

const FORMATS: Record<Format, { width: number; height: number }> = {
  '9:16': { width: 1080, height: 1920 },
  '4:5': { width: 1080, height: 1350 },
  '1:1': { width: 1080, height: 1080 },
}

export async function renderPolaroid(args: RenderArgs): Promise<Buffer> {
  const { width, height } = FORMATS[args.format]
  const fonts = await loadFonts()
  const theme = resolveThemePreset(args.themeKey)

  // Card sizing: keep a consistent polaroid feel across all 3 formats by
  // sizing the card to ~80% of the narrower edge, with the caption panel
  // below taking a fixed 44px (scaled by format).
  const cardWidth = Math.round(width * 0.78)
  const photoEdge = cardWidth - 48 // 24px border on both sides
  const captionH = Math.round(photoEdge * 0.45)
  const hasPhoto = Boolean(args.photoUrl)

  const svg = await satori(
    <div
      style={{
        width: `${width}px`,
        height: `${height}px`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.paper,
        fontFamily: 'Pretendard, MaruBuri, sans-serif',
        position: 'relative',
      }}
    >
      {/* Polaroid card */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: `${cardWidth}px`,
          backgroundColor: COLOR_PAPER,
          paddingTop: '24px',
          paddingLeft: '24px',
          paddingRight: '24px',
          paddingBottom: '44px',
          transform: 'rotate(-1.2deg)',
          boxShadow: '0 18px 42px rgba(26, 26, 26, 0.14)',
        }}
      >
        {/* Photo (1:1 crop) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: `${photoEdge}px`,
            height: `${photoEdge}px`,
            backgroundColor: hasPhoto ? '#eeeae3' : theme.colors.accentSoft,
            backgroundImage: hasPhoto ? `url(${args.photoUrl})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          {hasPhoto ? null : (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '22px',
                color: theme.colors.accent,
              }}
            >
              <PawMark color={theme.colors.accent} />
              <div
                style={{
                  fontFamily: 'MaruBuri',
                  fontSize: '30px',
                  color: theme.colors.moodHint,
                }}
              >
                사진 없이 남긴 오늘
              </div>
            </div>
          )}
        </div>

        {/* Caption area */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            marginTop: '20px',
            height: `${captionH}px`,
          }}
        >
          {/* Title row with accent dot */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '10px',
            }}
          >
            <div
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '9999px',
                backgroundColor: theme.colors.accent,
              }}
            />
            <div
              style={{
                fontFamily: 'Pretendard',
                fontWeight: 600,
                fontSize: '28px',
                color: COLOR_INK,
                lineHeight: 1.25,
              }}
            >
              {truncate(args.diaryTitle, 24)}
            </div>
          </div>

          {/* Diary body — MaruBuri, truncated to ~3 lines */}
          <div
            style={{
              fontFamily: 'MaruBuri',
              fontSize: '22px',
              color: COLOR_INK_SOFT,
              lineHeight: 1.55,
              display: '-webkit-box',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {truncate(args.diaryBody, 110)}
          </div>

          {/* Meta row — pet name lockup (우하단 느낌) */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'center',
              marginTop: 'auto',
              paddingTop: '12px',
              fontFamily: 'MaruBuri',
              fontSize: '18px',
              color: theme.colors.moodHint,
            }}
          >
            {args.petName}
          </div>
        </div>
      </div>
    </div>,
    {
      width,
      height,
      fonts: fonts.length
        ? fonts.map((f) => ({
            name: f.name,
            data: f.data,
            weight: f.weight,
            style: f.style,
          }))
        : // satori requires at least one font; if CDN fetch failed we pass
          // an empty array and let satori throw. Caller is expected to
          // catch and fall back to template PNG. In practice loadFonts
          // succeeds on cold start.
          [],
    },
  )

  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: width },
    background: theme.colors.paper,
    font: {
      loadSystemFonts: false,
    },
  })
  return resvg.render().asPng()
}

function PawMark({ color }: { color: string }) {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'relative',
        width: '118px',
        height: '104px',
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: '38px',
          bottom: '0px',
          width: '44px',
          height: '50px',
          borderRadius: '50% 50% 45% 45%',
          backgroundColor: color,
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: '0px',
          top: '34px',
          width: '28px',
          height: '34px',
          borderRadius: '9999px',
          backgroundColor: color,
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: '28px',
          top: '2px',
          width: '28px',
          height: '38px',
          borderRadius: '9999px',
          backgroundColor: color,
        }}
      />
      <div
        style={{
          position: 'absolute',
          right: '28px',
          top: '2px',
          width: '28px',
          height: '38px',
          borderRadius: '9999px',
          backgroundColor: color,
        }}
      />
      <div
        style={{
          position: 'absolute',
          right: '0px',
          top: '34px',
          width: '28px',
          height: '34px',
          borderRadius: '9999px',
          backgroundColor: color,
        }}
      />
    </div>
  )
}

function truncate(input: string, max: number): string {
  if (!input) return ''
  if (input.length <= max) return input
  return input.slice(0, max - 1).trimEnd() + '…'
}

/**
 * NOTE on the 5% grain (DESIGN §12):
 *
 * Real turbulence grain requires an SVG filter (`<feTurbulence>`), which
 * satori does not support. Options considered:
 *   1. Post-process the PNG through sharp with a noise overlay — adds
 *      ~100ms and another dep surface. Deferred to v1.5.
 *   2. Tile a base64 noise PNG as background-image — works in satori but
 *      the asset would need to ship with the bundle and blow up cold
 *      start. Deferred.
 *   3. Skip for now — polaroid identity is carried by the 24px border,
 *      -1.2deg tilt, typography, and serif body. Grain is nice-to-have.
 * Current implementation: SKIPPED. Tracked as follow-up.
 */
