import "server-only";
import { prisma } from "./prisma";
import { AppError } from "./errors";

export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

/** Identify the real file type from its first bytes; never trust the filename or browser-supplied type. */
export function detectImageType(b: Uint8Array): "image/jpeg" | "image/png" | "image/webp" | null {
  if (b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (
    b.length > 8 &&
    b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 &&
    b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a
  ) {
    return "image/png";
  }
  if (
    b.length > 12 &&
    String.fromCharCode(b[0], b[1], b[2], b[3]) === "RIFF" &&
    String.fromCharCode(b[8], b[9], b[10], b[11]) === "WEBP"
  ) {
    return "image/webp";
  }
  return null;
}

/** Validates an uploaded image from a multipart request and stores it. Returns its public URL. */
export async function saveUploadedImage(request: Request): Promise<string> {
  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) throw new AppError("Please choose an image file.", 400, "no_file");
  if (file.size > MAX_UPLOAD_BYTES) throw new AppError("That image is larger than 8 MB.", 413, "too_large");

  const bytes = new Uint8Array(await file.arrayBuffer());
  const mimeType = detectImageType(bytes);
  if (!mimeType) throw new AppError("Only JPEG, PNG or WebP images are allowed.", 415, "bad_type");

  const saved = await prisma.uploadedFile.create({
    data: { mimeType, size: bytes.length, data: bytes },
    select: { id: true },
  });
  return `/api/files/${saved.id}`;
}

/** Deletes the stored file behind an /api/files/<id> URL (no-op for any other URL). */
export async function deleteUploadedByUrl(url: string | null | undefined) {
  const match = url?.match(/^\/api\/files\/([a-z0-9]+)$/i);
  if (match) await prisma.uploadedFile.deleteMany({ where: { id: match[1] } });
}
