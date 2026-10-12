---
status: accepted
---

# Avatars in S3 behind CloudFront; store the key, re-encode on upload

Hosting is moving to AWS, so avatars move from Google Cloud Storage to a private S3 bucket served through CloudFront with Origin Access Control. The backend still proxies the upload, but no longer trusts it: it enforces a 5 MB cap and a JPEG/PNG/WebP allowlist, re-encodes with `sharp` to a 512x512 WebP (which strips EXIF/GPS), and writes to `<userId>/<uuid>.webp`, never a user-supplied name. The User stores only that key (`avatarKey`); the API response builds `avatarUrl` as `${S3_CDN_BASE_URL}/${avatarKey}`, so the contract with the frontend is unchanged. Credentials come from the AWS SDK default provider chain (IAM role in prod), never from config.

Profile code depends on a `FileStore` port (put / delete by key), with an S3 adapter and an in-memory adapter used by tests. Avatar policy (key format, MIME, size, re-encode) lives in the User module, not the storage module.

## Considered Options

- **Store the full URL**: ties every row to one CDN hostname; changing it needs a data migration.
- **Public bucket**: simpler, but bypasses the CDN and exposes the bucket directly.
- **Presigned browser uploads**: avoids proxying bytes, but cannot re-encode or validate the image; out of scope for now.
- **Keep original bytes**: smaller code, but serves user-supplied files and leaks EXIF/GPS.

## Consequences

- Replacing an avatar uploads the new object, saves the User, then deletes the old key; deleting the account deletes its key after the commit. A failed delete is logged and never fails the request, so it can leave an orphaned object.
- Keys are immutable and uniquely named, so objects are served with `Cache-Control: public, max-age=31536000, immutable`.
- `S3_REGION`, `S3_BUCKET` and `S3_CDN_BASE_URL` are required at boot.
- AWS resources are created by hand per `docs/infra/avatar-storage.md`.

See fustroli/bitewise-backend#65.
