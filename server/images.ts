import path from 'node:path';
import fs from 'node:fs';

const EXT_BY_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

export function extForMime(mime: string): string | null {
  return EXT_BY_MIME[mime] ?? null;
}

export const IMAGES_DIR =
  process.env.PRODUCT_IMAGES_DIR ||
  path.join(process.env.ProgramData || 'C:\\ProgramData', 'CrepettooPOS', 'images', 'products');

export function ensureImagesDir(): void {
  fs.mkdirSync(IMAGES_DIR, { recursive: true });
}

export function isValidImageBuffer(buf: Buffer, ext: string): boolean {
  if (buf.length < 12) return false;
  if (ext === 'jpg') {
    return buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
  }
  if (ext === 'png') {
    return buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47;
  }
  if (ext === 'webp') {
    return buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP';
  }
  return false;
}
