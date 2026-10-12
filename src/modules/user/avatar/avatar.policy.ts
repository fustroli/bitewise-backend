import { randomUUID } from 'crypto';
import { BadRequestException } from '@nestjs/common';
import sharp from 'sharp';

const BYTES_PER_MB = 1024 * 1024; // eslint-disable-line @typescript-eslint/no-magic-numbers
const AVATAR_MAX_MB = 5;
export const AVATAR_MAX_BYTES = AVATAR_MAX_MB * BYTES_PER_MB;
export const AVATAR_SIZE_PX = 512;
export const AVATAR_ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
];
export const AVATAR_CONTENT_TYPE = 'image/webp';
export const AVATAR_CACHE_CONTROL = 'public, max-age=31536000, immutable';

export const avatarKey = (userId: number) => `${userId}/${randomUUID()}.webp`;

/** 512×512 WebP; sharp drops EXIF/GPS unless asked to keep it. 400 if undecodable. */
export async function encodeAvatar(file: Express.Multer.File): Promise<Buffer> {
  if (!AVATAR_ALLOWED_MIME_TYPES.includes(file.mimetype))
    throw new BadRequestException('Avatar must be a JPEG, PNG or WebP image');

  try {
    return await sharp(file.buffer)
      .rotate()
      .resize(AVATAR_SIZE_PX, AVATAR_SIZE_PX, { fit: 'cover' })
      .webp()
      .toBuffer();
  } catch {
    throw new BadRequestException('Avatar is not a valid image');
  }
}
