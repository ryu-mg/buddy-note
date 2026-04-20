/**
 * Browser-side EXIF stripping via Canvas.
 *
 * FIRST line of defense per AGENTS.md "client Canvas + server sharp 이중
 * EXIF strip". Drawing the image onto a canvas and re-encoding as JPEG
 * loses EXIF metadata as a side effect of the raster re-encode — browsers
 * do not preserve EXIF across canvas draws.
 *
 * Intentionally pure client module — NO `server-only` import — so this
 * file is safe to import from 'use client' components.
 */

const MAX_EDGE = 2000
const JPEG_QUALITY = 0.88

/**
 * Takes a user-selected File (from <input type="file">) and returns a JPEG
 * Blob with all metadata stripped.
 *
 * If decoding fails (e.g. an iOS HEIC that the browser can't natively
 * decode) we fall back to returning the original File — the server-side
 * sharp pass is the safety net, so GPS is still removed downstream.
 */
export async function stripExifClient(file: File): Promise<Blob> {
  try {
    const bitmap = await decode(file)
    const { width, height } = resizeDims(bitmap.width, bitmap.height)

    if (typeof OffscreenCanvas !== 'undefined') {
      const canvas = new OffscreenCanvas(width, height)
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('2d context unavailable')
      ctx.drawImage(bitmap, 0, 0, width, height)
      bitmap.close?.()
      return await canvas.convertToBlob({
        type: 'image/jpeg',
        quality: JPEG_QUALITY,
      })
    }

    // Fallback for browsers without OffscreenCanvas (older Safari).
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('2d context unavailable')
    ctx.drawImage(bitmap, 0, 0, width, height)
    bitmap.close?.()
    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob)
          else reject(new Error('canvas.toBlob returned null'))
        },
        'image/jpeg',
        JPEG_QUALITY,
      )
    })
  } catch {
    // Server-side sharp strip is the safety net — returning the original
    // file here is acceptable. Do NOT surface an error to the caller; the
    // upload flow should still proceed.
    return file
  }
}

async function decode(file: File): Promise<ImageBitmap> {
  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(file)
    } catch {
      // fall through to HTMLImageElement path
    }
  }

  const url = URL.createObjectURL(file)
  try {
    const img = await loadHtmlImage(url)
    return await createImageBitmap(img)
  } finally {
    URL.revokeObjectURL(url)
  }
}

function loadHtmlImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('image decode failed'))
    img.src = src
  })
}

function resizeDims(
  w: number,
  h: number,
): { width: number; height: number } {
  const longest = Math.max(w, h)
  if (longest <= MAX_EDGE) return { width: w, height: h }
  const scale = MAX_EDGE / longest
  return {
    width: Math.round(w * scale),
    height: Math.round(h * scale),
  }
}
