/**
 * imagePreprocess.ts
 *
 * Resizes any browser-readable image to a fixed size and encodes it as an
 * RGB565 BMP file — entirely in the browser, no external libraries.
 *
 * RGB565 packing: RRRRR GGGGGG BBBBB (16 bits per pixel, little-endian)
 * BMP row order:  bottom-to-top (standard BMP convention)
 */

export interface PreprocessOptions {
    /** Output width in pixels.  Default: 200 */
    width?: number;
    /** Output height in pixels. Default: 200 */
    height?: number;
}

/**
 * Accepts any image File the browser can decode, resizes it to target
 * dimensions (cover-crop, centred), and returns a new File encoded as
 * an RGB565 BMP ready for upload.
 */
export async function preprocessToBmp(
    file: File,
    options: PreprocessOptions = {},
): Promise<File> {
    const { width = 240, height = 240 } = options;

    // ── 1. Decode the source image ────────────────────────────────────────────
    const bitmap = await createImageBitmap(file);

    // ── 2. Resize with cover-crop onto a canvas ───────────────────────────────
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d")!;

    // Scale so the image fills the target rect, then centre-crop
    const scale = Math.max(width / bitmap.width, height / bitmap.height);
    const srcW = width / scale;
    const srcH = height / scale;
    const srcX = (bitmap.width - srcW) / 2;
    const srcY = (bitmap.height - srcH) / 2;

    ctx.drawImage(bitmap, srcX, srcY, srcW, srcH, 0, 0, width, height);
    bitmap.close();

    // ── 3. Read raw RGBA pixels ───────────────────────────────────────────────
    const { data: rgba } = ctx.getImageData(0, 0, width, height);

    // ── 4. Encode as RGB565 BMP ───────────────────────────────────────────────
    const bmpBuffer = encodeRgb565Bmp(rgba, width, height);

    const outputName = file.name.replace(/\.[^.]+$/, "") + ".bmp";
    return new File([bmpBuffer], outputName, { type: "image/bmp" });
}

// ─── BMP encoder ─────────────────────────────────────────────────────────────

/**
 * Builds a valid BMP file with BI_BITFIELDS RGB565 encoding.
 *
 * File layout:
 *   BITMAPFILEHEADER  14 bytes
 *   BITMAPINFOHEADER  40 bytes
 *   RGB color masks   12 bytes  (required for BI_BITFIELDS)
 *   Pixel data         W×H×2 bytes  (bottom-to-top row order)
 */
function encodeRgb565Bmp(
    rgba: Uint8ClampedArray,
    width: number,
    height: number,
): ArrayBuffer {
    const pixelBytes = width * height * 2; // 2 bytes per RGB565 pixel
    const colorMasks = 12;
    const fileHdrSize = 14;
    const dibHdrSize = 40;
    const dataOffset = fileHdrSize + dibHdrSize + colorMasks;
    const fileSize = dataOffset + pixelBytes;

    const buf = new ArrayBuffer(fileSize);
    const view = new DataView(buf);
    let p = 0; // write cursor

    // ── BITMAPFILEHEADER ─────────────────────────────────────────────────────
    view.setUint8(p++, 0x42); // 'B'
    view.setUint8(p++, 0x4D); // 'M'
    view.setUint32(p, fileSize, true);
    p += 4;
    view.setUint32(p, 0, true);
    p += 4; // reserved
    view.setUint32(p, dataOffset, true);
    p += 4;

    // ── BITMAPINFOHEADER ─────────────────────────────────────────────────────
    view.setUint32(p, 40, true);
    p += 4; // header size
    view.setInt32(p, width, true);
    p += 4;
    view.setInt32(p, height, true);
    p += 4; // positive → bottom-up storage
    view.setUint16(p, 1, true);
    p += 2; // color planes (must be 1)
    view.setUint16(p, 16, true);
    p += 2; // bits per pixel
    view.setUint32(p, 3, true);
    p += 4; // compression: BI_BITFIELDS
    view.setUint32(p, pixelBytes, true);
    p += 4;
    view.setInt32(p, 2835, true);
    p += 4; // ~72 DPI horizontal
    view.setInt32(p, 2835, true);
    p += 4; // ~72 DPI vertical
    view.setUint32(p, 0, true);
    p += 4; // colors in palette
    view.setUint32(p, 0, true);
    p += 4; // important colors

    // ── RGB565 channel masks ──────────────────────────────────────────────────
    //   Red:   bits 15–11  →  1111 1000 0000 0000  =  0xF800
    //   Green: bits 10–5   →  0000 0111 1110 0000  =  0x07E0
    //   Blue:  bits  4–0   →  0000 0000 0001 1111  =  0x001F
    view.setUint32(p, 0xF800, true);
    p += 4;
    view.setUint32(p, 0x07E0, true);
    p += 4;
    view.setUint32(p, 0x001F, true);
    p += 4;

    // ── Pixel data (bottom-to-top row order) ─────────────────────────────────
    for (let row = height - 1; row >= 0; row--) {
        for (let col = 0; col < width; col++) {
            const i = (row * width + col) * 4; // RGBA source index
            const r = rgba[i];
            const g = rgba[i + 1];
            const b = rgba[i + 2];
            //  R: take top 5 bits → shift to bits 15–11
            //  G: take top 6 bits → shift to bits 10–5
            //  B: take top 5 bits → keep at bits 4–0
            const rgb565 = ((r & 0xF8) << 8) | ((g & 0xFC) << 3) | (b >> 3);
            view.setUint16(p, rgb565, true); // little-endian
            p += 2;
        }
    }

    return buf;
}