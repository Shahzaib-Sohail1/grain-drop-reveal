/**
 * Client-side 90s film filter applied via HTML5 Canvas pixel manipulation.
 * Zero cloud calls — every operation runs on the guest's device.
 *
 * Pipeline (per pixel):
 *  1. Contrast boost around mid-gray (128).
 *  2. Warm amber/sepia tint shift (push R+G up, drop B).
 *  3. Subtle vignette darkening near edges.
 *  4. Additive monochrome grain noise.
 * Then we re-encode to JPEG with quality tuned for <300KB output.
 */
export interface FilterOptions {
  contrast?: number;   // 1.0 = none, 1.25 = +25%
  warmth?: number;     // 0..1 amber tint strength
  grain?: number;      // 0..1 noise intensity
  vignette?: number;   // 0..1 edge darkening
}

export async function applyFilmFilter(
  source: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement,
  opts: FilterOptions = {},
): Promise<Blob> {
  const contrast = opts.contrast ?? 1.22;
  const warmth = opts.warmth ?? 0.35;
  const grain = opts.grain ?? 0.18;
  const vignette = opts.vignette ?? 0.55;

  // Render to a square canvas, web-optimized for upload.
  // Cap at 1080 to keep file size well below 300KB after JPEG compression.
  const SIZE = 1080;
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;

  // Center-crop the source into a square viewport.
  const sw = "videoWidth" in source ? source.videoWidth : (source as HTMLImageElement).naturalWidth || (source as HTMLCanvasElement).width;
  const sh = "videoHeight" in source ? source.videoHeight : (source as HTMLImageElement).naturalHeight || (source as HTMLCanvasElement).height;
  const side = Math.min(sw, sh);
  const sx = (sw - side) / 2;
  const sy = (sh - side) / 2;
  ctx.drawImage(source as CanvasImageSource, sx, sy, side, side, 0, 0, SIZE, SIZE);

  // Pixel-level manipulation loop.
  const img = ctx.getImageData(0, 0, SIZE, SIZE);
  const d = img.data;
  const cx = SIZE / 2;
  const cy = SIZE / 2;
  const maxDist = Math.hypot(cx, cy);

  for (let i = 0; i < d.length; i += 4) {
    let r = d[i];
    let g = d[i + 1];
    let b = d[i + 2];

    // 1. Contrast around mid-gray.
    r = (r - 128) * contrast + 128;
    g = (g - 128) * contrast + 128;
    b = (b - 128) * contrast + 128;

    // 2. Warm amber/sepia shift — additive on R/G, subtractive on B.
    r += 22 * warmth;
    g += 10 * warmth;
    b -= 28 * warmth;

    // 3. Vignette darkening based on distance from center.
    const px = (i / 4) % SIZE;
    const py = Math.floor((i / 4) / SIZE);
    const dist = Math.hypot(px - cx, py - cy) / maxDist;
    const vig = 1 - vignette * Math.pow(dist, 2.4);
    r *= vig; g *= vig; b *= vig;

    // 4. Monochrome film grain — same noise across channels per pixel.
    const noise = (Math.random() - 0.5) * 255 * grain;
    r += noise; g += noise; b += noise;

    d[i]     = r < 0 ? 0 : r > 255 ? 255 : r;
    d[i + 1] = g < 0 ? 0 : g > 255 ? 255 : g;
    d[i + 2] = b < 0 ? 0 : b > 255 ? 255 : b;
  }
  ctx.putImageData(img, 0, 0);

  // Date stamp overlay — classic 90s disposable camera vibe.
  const stamp = new Date().toLocaleDateString("en-US", {
    year: "2-digit", month: "2-digit", day: "2-digit",
  }).replaceAll("/", " ");
  ctx.font = "bold 38px 'Courier New', monospace";
  ctx.fillStyle = "rgba(255, 140, 40, 0.92)";
  ctx.shadowColor = "rgba(255, 80, 0, 0.8)";
  ctx.shadowBlur = 6;
  ctx.fillText(stamp, SIZE - 220, SIZE - 38);

  // Re-encode with progressive quality reduction until <300KB.
  return await encodeUnder(canvas, 300 * 1024);
}

async function encodeUnder(canvas: HTMLCanvasElement, maxBytes: number): Promise<Blob> {
  for (const q of [0.82, 0.72, 0.62, 0.5, 0.4]) {
    const blob: Blob = await new Promise((res) =>
      canvas.toBlob((b) => res(b!), "image/jpeg", q),
    );
    if (blob.size <= maxBytes) return blob;
  }
  // Last resort: return the smallest attempt.
  return await new Promise((res) =>
    canvas.toBlob((b) => res(b!), "image/jpeg", 0.35),
  );
}
