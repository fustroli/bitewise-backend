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
      "Resource": ["arn:aws:ses:<region>:<account-id>:identity/*"]
    }
  ]
}
```

`identity/*`: in the sandbox SES also checks the recipient identity; it only covers identities
verified in this account.

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

## 6. Bounces and complaints

No app-side handling (fustroli/bitewise-backend#88 closed): SES does it.

1. SES > Configuration > Suppression list: account-level suppression **enabled for bounces and
   complaints** (default for accounts that started on SES after 2019-11-25). SES then never
   sends to an address that hard-bounced or complained.
2. SNS > Topics > Create topic: Standard, `bitewise-ses-alerts`. Create subscription: Email,
   your inbox; confirm it from the email.
3. CloudWatch > Alarms > Create alarm (us-east-1): Metrics, Classic, Select metric > SES
   (account-level, no dimensions):

   | Alarm                | Metric                     | Threshold  |
   | -------------------- | -------------------------- | ---------- |
   | `ses-bounce-rate`    | `Reputation.BounceRate`    | >= `0.04`  |
   | `ses-complaint-rate` | `Reputation.ComplaintRate` | >= `0.001` |

   Statistic Maximum, period 1 hour, missing data **ignore**; In alarm > SNS `bitewise-ses-alerts`.

AWS reviews an account at a 5% bounce / 0.1% complaint rate and may pause sending at 10% /
0.5%. At low volume one bounce (a mistyped sign-up) can fire the bounce alarm: check the
suppression list for the address.

## 7. Production access

SES > Account dashboard > Request production access: Transactional, website URL, English.
The acknowledgement (a bounce/complaint process) is covered by section 6. Until approved,
sign-ups with unverified addresses get no email; afterwards the sandbox test identity can be
deleted (the IAM policy needs no change).
