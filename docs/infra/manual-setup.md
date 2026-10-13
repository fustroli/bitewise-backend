# App hosting runbook (manual console setup)

Manual AWS console setup of the app host. `infra/bitewise-stack.yaml` is the reference
for the target shape (not deployed). Fill in the values you actually chose. Region: `us-east-1`.

Avatar bucket + CloudFront: see `avatar-storage.md`.

## Decisions

| Item | Value |
| --- | --- |
| Domain | bitewise.rolandfuest.com (DNS: Namecheap) |
| Instance type | t3.micro |
| AMI | |
| VPC / subnet | |
| Elastic IP | |

## 1. Network

- [x] VPC (or default VPC), public subnet, internet gateway, route table

## 2. Security group

- [x] No SSH: shell via SSM Session Manager (port 22 closed, no key pair)
- [x] HTTP (80) from the CloudFront origin-facing prefix list

## 3. IAM instance role

- [x] `AmazonSSMManagedInstanceCore` (role `bitewise-ec2-role`)
- [x] Backup bucket: `s3:PutObject`/`s3:GetObject` on `backups/*`, `s3:ListBucket` on the bucket
- [x] Avatar bucket: `s3:PutObject`, `s3:DeleteObject` only

## 4. EC2 instance

- [x] Launch (Ubuntu 24.04, gp3 encrypted volume, IMDSv2 required, role attached; key pair later removed)
- [x] Elastic IP associated
- [x] 2 GB swap

## 5. Server software

- [x] nginx: `/` to Next.js `:3000`, `/api/` to Nest `:8000`
- [x] nginx sets `Host $host`, `X-Forwarded-Host $host`, `X-Forwarded-Proto https` (CloudFront
  terminates TLS, so `$scheme` would be `http`) in both `location` blocks. Config:
  `/etc/nginx/sites-available/bitewise` (`sites-enabled` is a symlink; `grep -r` skips it)
- Next builds `request.url` from its own bind address (`localhost:3000`), ignoring `Host` and
  `X-Forwarded-Host`. Frontend redirects must be relative or use a configured public URL (#94)
- [x] MySQL 8, low-memory config, `bitewise` DB + user
- [x] Node 22, pm2 (+ `pm2 startup`)
- [x] Bun (per-user, needs `unzip`)

## 6. Backend `.env`

- [x] `TRUST_PROXY_HOPS=2` (CloudFront + nginx)
- [x] Other values: see `.env.example`
- [x] Auth URLs/cookies (single domain: nginx serves FE `/` and BE `/api/` on the same host):
  - `FRONTEND_URL=https://bitewise.rolandfuest.com` (OAuth post-login redirect + CORS origin)
  - `GOOGLE_CALLBACK_URL=https://bitewise.rolandfuest.com/api/auth/google/callback`, same URI in the Google console
  - `COOKIE_DOMAIN`: leave **empty** on BE and FE (host-only cookie). The BE sets the session
    cookies and the Next server reads them on the same host, so no `Domain` attribute is needed.
    Only set it (e.g. `.rolandfuest.com`) if the FE and API ever move to different subdomains;
    otherwise the FE never sees the cookies.
  - Session cookies are `SameSite=Lax` (not Strict): Strict cookies are withheld on the landing
    request after the Google redirect chain, so `/dashboard` would bounce back to `/`

## 7. Certificate + CloudFront

- [x] ACM cert (us-east-1, DNS validation); validation CNAME added at DNS provider
- [x] Distribution: origin = EC2 public DNS, HTTP only; alias = domain
- [x] Default behavior: caching disabled, all methods, AllViewer origin request policy
- [x] `/_next/static/*` behavior: CachingOptimized
- [x] DNS CNAME: domain to the distribution domain

## 8. Deploy

- [x] How code gets onto the box: manual `git clone`/`git pull` + build on the box, pm2 (pipeline optional later)
- [x] `bun run migration:run` before first start

## 9. Backups

> **Resume here:** nothing pending. Section 11 (daytime schedule) deferred until dev phase is done.

- [x] Separate backup bucket (not the avatar bucket: its policy lets CloudFront read `/*`),
      Block Public Access on, lifecycle: expire `backups/` after 14 days
- [x] Nightly `mysqldump | gzip` to S3 `backups/` (`/usr/local/bin/bitewise-db-backup`,
      `/etc/cron.d/bitewise-db-backup`, 03:30 UTC, runs as root via `auth_socket`)
- [x] Restore test into a scratch DB (a backup never restored isn't a backup):
  ```bash
  sudo mysql -e 'CREATE DATABASE restore_test'
  aws s3 cp s3://<backup-bucket>/backups/bitewise-<date>.sql.gz - | gunzip | sudo mysql restore_test
  sudo mysql -e 'SHOW TABLES FROM restore_test; DROP DATABASE restore_test'
  ```
- [x] EBS daily snapshots (DLM): tag instance `Backup=bitewise`, EC2 > Lifecycle Manager > EBS
      snapshot policy targeting that tag, daily, keep 7
- Restore for real: `aws s3 cp s3://<backup-bucket>/backups/<file> - | gunzip | sudo mysql bitewise`

## 10. Cost guard

- [x] CloudWatch log groups (e.g. `/codebuild/bitewise`): set retention to 14 days after the first build creates it (default is never expire)

## 11. Daytime-only schedule (optional, saves ~$4-5/mo)

Stopping the instance stops the compute charge only. EBS, snapshots and the Elastic IP still bill.

- [ ] Elastic IP kept (an auto-assigned IP changes on start and breaks the CloudFront origin)
- [ ] `pm2 save` done (with `pm2 startup`) so apps return after a start; nginx and MySQL return via systemd
- [ ] Backup cron moved into up-hours (03:30 UTC would be skipped while stopped)
- [ ] Start/stop: manual (`aws ec2 start-instances` / `stop-instances`) or EventBridge Scheduler, two schedules with a role allowing `ec2:StartInstances` / `ec2:StopInstances`
- Start time: `<hh:mm>`; stop time: `<hh:mm>`; timezone: `<tz>`

Expect:
- Site returns 502/504 via CloudFront while stopped.
- ~1-2 min after start before the site responds.
- Pipeline deploys fail while stopped (CodeDeploy agent is down); deploy during up-hours or re-run after a start.

## 12. Pipeline (CodePipeline, backend + frontend)

Auto-trigger on push to `main`. Backend deploy runs `scripts/migrate.sh` (AfterInstall) before start.

- [x] 1. Artifact bucket (private, versioned, expire after 14 days), `s3:GetObject`/`GetObjectVersion`
      on it added to `bitewise-ec2-role`, GitHub connection `bitewise-github` (Available, both repos)
- [x] 2. CodeDeploy agent on the instance, instance tagged `Name=bitewise`
- [x] 3. CodeDeploy service role, app `bitewise`, deployment groups `backend` + `frontend` (AllAtOnce, tag `Name=bitewise-app`)
- [x] 4. CodeBuild service role + projects `bitewise-backend-build`, `bitewise-frontend-build`
      (FE env: `COOKIE_DOMAIN`, `NEXT_PUBLIC_API_URL`); log group `/codebuild/bitewise`, retention 14 days
- [x] 5. Pipeline service role + pipelines `bitewise-backend`, `bitewise-frontend` (Source > Build > Deploy)
- [x] 6. Verify: push a commit, all stages green, `GET /api/health`

## Gotchas hit

-

## Differs from `infra/bitewise-stack.yaml`

- No SSH ingress rule or key pair; admin access via SSM Session Manager only.
- DNS stays at Namecheap (subdomain CNAME), no Route 53.
- CloudFront on the flat-rate Free plan (WAF included, no price class); alias, cert, HTTP/3 and
  behaviors set after creation. Watch WAF body-size rules on avatar uploads.
- DB dumps go to a dedicated backup bucket, not the artifact bucket; no CodeBuild/CodeDeploy yet.
