import 'server-only'

import sharp from 'sharp'

/**
 * Server-side EXIF stripping via sharp.
 *
 * This is the SECOND line of defense (the first is `exif-strip-client.ts`
 * drawing the image through a Canvas). Per AGENTS.md the requirement is
 * "client Canvas + server sharp 이중 EXIF strip" — the output of this
 * function MUST NOT contain any EXIF/IPTC/XMP/ICC metadata, most critically
 * no GPS coordinates.
 *
 * Input: any format sharp can decode (JPEG, PNG, WebP, HEIC/HEIF on
 *        supported builds, AVIF, TIFF). We do NOT forward metadata.
 * Output: JPEG buffer. The LLM pipeline + satori work with a normalized
 *         format, and JPEG keeps file size reasonable.
 */
export async function stripExifServer(input: Buffer): Promise<Buffer> {
  // sharp() by default drops ALL metadata on output unless .withMetadata()
  // is called. We explicitly DO NOT call withMetadata(). .rotate() (no args)
  // auto-orients via EXIF then discards the Orientation tag so the pixel
  // data matches the visual expectation. .toColourspace('srgb') prevents
  // weird wide-gamut ICC profiles from leaking.
  return sharp(input, { failOn: 'none' })
    .rotate()
    .toColourspace('srgb')
    .jpeg({ quality: 85, mozjpeg: true })
    .toBuffer()
}

/**
 * Helper for satori sizing — returns the pixel dimensions of a decoded
 * image buffer. Used when composing polaroids so we know the photo's
 * aspect ratio before cropping to 1:1.
 */
export async function getImageDimensions(
  buffer: Buffer,
): Promise<{ width: number; height: number }> {
  const meta = await sharp(buffer).metadata()
  const width = meta.width ?? 0
  const height = meta.height ?? 0
  if (!width || !height) {
    throw new Error('이미지 크기를 읽을 수 없어요.')
  }
  return { width, height }
}
