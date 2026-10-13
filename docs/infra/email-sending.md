# Email sending runbook (SES)

Manual AWS console setup. See ADR-0004 for the design. Local dev doesn't need any of
this: use `MAIL_TRANSPORT=log` (the link is logged at debug level).

## 1. Domain identity

1. SES (in `<region>`, which becomes `AWS_REGION`) > Identities > Create identity > **Domain**: `rolandfuest.com`.
2. Easy DKIM, RSA 2048, publish DNS records: on.
3. Add the 3 DKIM CNAMEs at Namecheap (Host = the name without `.rolandfuest.com`).
4. Add a DMARC TXT record: Host `_dmarc`, value `v=DMARC1; p=none;`.
5. Wait for the identity to show **Verified**.

SPF: with SES's default MAIL FROM domain (`amazonses.com`), nothing to add.

## 2. Sandbox test recipient

While in the sandbox SES only delivers to verified identities. Create identity > **Email address**
(your own inbox), click the link SES mails you.

## 3. Instance role

Add to the EC2 instance role (inline policy):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "ses:SendEmail",
      "Resource": [
        "arn:aws:ses:<region>:<account-id>:identity/rolandfuest.com",
        "arn:aws:ses:<region>:<account-id>:identity/<your-inbox>"
      ]
    }
  ]
}
```

While in the sandbox, SES also checks the recipient identity, hence the second ARN.

## 4. Backend `.env` (prod)

```
MAIL_TRANSPORT=ses
MAIL_FROM=BiteWise <no-reply@rolandfuest.com>
AWS_REGION=<region>
```

Set before deploying the release that contains email verification: the app and
`migration:run` refuse to start without them.

## 5. Smoke test

Sign up on prod with the verified inbox; the email arrives, the link verifies, and
`GET /api/users/me` shows `emailVerified: true`. A failed send is logged as
`Failed to send "Verify your BiteWise email"` (pm2 logs) and never fails sign-up.

## 6. Production access

SES > Account dashboard > Request production access (transactional, expected volume, how
bounces are handled: not yet, fustroli/bitewise-backend#88). Until approved, sign-ups with
unverified addresses get no email.
