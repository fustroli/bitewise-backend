# Avatar storage runbook (S3 + CloudFront)

Manual AWS console setup. See ADR-0003 for the design.

## 1. S3 bucket

1. S3 > Create bucket. Name `<bucket>`, region `<region>`.
2. Keep **Block all public access** ON.
3. Leave ACLs disabled; default encryption (SSE-S3) is fine.

## 2. CloudFront distribution

1. CloudFront > Create distribution. Origin: the bucket (S3 REST endpoint, not website endpoint).
2. Origin access: **Origin access control (OAC)**; create a new OAC (sign requests).
3. Viewer protocol policy: Redirect HTTP to HTTPS. Allowed methods: GET, HEAD.
4. Cache policy: `CachingOptimized`.
5. Note the domain, e.g. `https://dxxxx.cloudfront.net`; this is `S3_CDN_BASE_URL` (no trailing slash). Use a custom domain if you add one.

## 3. Bucket policy (only this distribution may read)

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowCloudFrontRead",
      "Effect": "Allow",
      "Principal": { "Service": "cloudfront.amazonaws.com" },
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::<bucket>/*",
      "Condition": {
        "StringEquals": {
          "AWS:SourceArn": "arn:aws:cloudfront::<account-id>:distribution/<distribution-id>"
        }
      }
    }
  ]
}
```

## 4. App IAM policy

Attach to the app's IAM role (prod) or the profile used locally. Write and delete only:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:DeleteObject"],
      "Resource": "arn:aws:s3:::<bucket>/*"
    }
  ]
}
```

No access keys in config: the SDK default provider chain picks up the role in prod and `AWS_PROFILE` locally.

## 5. Environment variables

| Variable          | Example                        |
| ----------------- | ------------------------------ |
| `S3_REGION`       | `eu-central-1`                 |
| `S3_BUCKET`       | `<bucket>`                     |
| `S3_CDN_BASE_URL` | `https://dxxxx.cloudfront.net` |

The app refuses to boot if any is missing. Remove the old `GCP_*` variables and the GCS key file.

## 6. Verify

Upload an avatar via `POST /api/users/me/avatar`; the response `avatarUrl` should load through CloudFront, while the direct S3 object URL returns 403.
