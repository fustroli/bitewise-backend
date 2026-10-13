---
status: accepted
---

# Transactional email via SES, behind a `MailTransport` port

Email verification (and later password reset) needs transactional email. The app is hosted on AWS, so it sends through Amazon SES v2 (`@aws-sdk/client-sesv2`), with credentials from the AWS SDK default provider chain (instance role in prod), never from config, as for S3 (ADR-0003).

Feature code depends on `MailService`, which sends over a `MailTransport` port picked at boot by `MAIL_TRANSPORT`: `ses` in prod, `smtp` (nodemailer, unauthenticated) for a local catcher like Mailpit, `log` to send nothing. Templates are plain TS functions returning `{subject, html, text}`.

Sending is fire-and-forget: the request that triggers an email doesn't wait for it, and a failed send is logged, never surfaced. There is no queue or retry; a lost verification email is recovered by the User requesting another.

Email verification tokens are random 32-byte values; only their SHA-256 is stored, with a `purpose` column (varchar, so a new purpose needs no migration) so password reset can reuse the table.

## Considered Options

- **Mailgun / other providers**: free tiers too small (~100/day), and another account to run; SES is ~$0.10 per 1,000 on the platform we're already on.
- **A queue (SQS) with retries**: more reliable delivery, but more infrastructure than sign-up volume justifies now.
- **Codes instead of links**: links are one click and need no extra input on the frontend.

## Consequences

- `MAIL_TRANSPORT` and `MAIL_FROM` are required at boot; `AWS_REGION` with `ses`, `SMTP_HOST`/`SMTP_PORT` with `smtp`.
- AWS setup is manual, per `docs/infra/email-sending.md`.
- SES needs the sending domain verified (DKIM, SPF) and production access (leaving the sandbox) before it can mail arbitrary addresses; the instance role needs `ses:SendEmail`.
- Bounces and complaints are not handled yet (fustroli/bitewise-backend#88).

See fustroli/bitewise-backend#4.
