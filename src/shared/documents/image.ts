import { base64ToBytes } from '@/shared/utils/base64';

export interface ImageInfo {
  type: 'png' | 'jpg';
  bytes: Uint8Array;
  width: number;
  height: number;
}

function pngSize(b: Uint8Array): [number, number] | null {
  if (b.length < 24 || b[0] !== 0x89 || b[1] !== 0x50) return null;
  const view = new DataView(b.buffer, b.byteOffset, b.byteLength);
  return [view.getUint32(16), view.getUint32(20)];
}

function jpegSize(b: Uint8Array): [number, number] | null {
  if (b.length < 4 || b[0] !== 0xff || b[1] !== 0xd8) return null;
  let i = 2;
  while (i + 9 < b.length) {
    if (b[i] !== 0xff) {
      i++;
      continue;
    }
    const marker = b[i + 1];
    const length = (b[i + 2] << 8) | b[i + 3];
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      return [(b[i + 7] << 8) | b[i + 8], (b[i + 5] << 8) | b[i + 6]];
    }
    i += 2 + length;
  }
  return null;
}

/** Decodes a png/jpeg data URL. Returns null when it is not a usable image. */
export function decodeImageDataUrl(dataUrl: string): ImageInfo | null {
  const match = /^data:image\/(png|jpe?g);base64,(.+)$/is.exec((dataUrl ?? '').trim());
  if (!match) return null;
  try {
    const bytes = base64ToBytes(match[2].replace(/\s+/g, ''));
    const type = match[1].toLowerCase() === 'png' ? 'png' : 'jpg';
    const size = type === 'png' ? pngSize(bytes) : jpegSize(bytes);
    if (!size || !size[0] || !size[1]) return null;
    return { type, bytes, width: size[0], height: size[1] };
  } catch {
    return null;
  }
}

/** Fits an image into a box keeping its aspect ratio. */
export function fitImage(info: { width: number; height: number }, max: number): { width: number; height: number } {
  const scale = Math.min(max / info.width, max / info.height);
  return { width: info.width * scale, height: info.height * scale };
}
