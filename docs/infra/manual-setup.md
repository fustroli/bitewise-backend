# App hosting runbook (manual console setup)

Manual AWS console setup of the app host. `infra/bitewise-stack.yaml` is the reference
for the target shape (not deployed). Fill in the values you actually chose. Region: `us-east-1`.

Avatar bucket + CloudFront: see `avatar-storage.md`.

## Decisions

| Item | Value |
| --- | --- |
| Domain | |
| Instance type | t3.micro |
| AMI | |
| VPC / subnet | |
| Elastic IP | |
| Monthly budget | |

## 1. Network

- [ ] VPC (or default VPC), public subnet, internet gateway, route table

## 2. Security group

- [ ] SSH (22) from `<my-ip>/32`
- [ ] HTTP (80) from the CloudFront origin-facing prefix list

## 3. IAM instance role

- [ ] `AmazonSSMManagedInstanceCore`
- [ ] Artifact bucket: Get/Put/List
- [ ] Avatar bucket: `s3:PutObject`, `s3:DeleteObject` only

## 4. EC2 instance

- [ ] Launch (Ubuntu 24.04, gp3 encrypted volume, IMDSv2 required, role attached, key pair)
- [ ] Elastic IP associated
- [ ] 2 GB swap

## 5. Server software

- [ ] nginx: `/` to Next.js `:3000`, `/api/` to Nest `:8000`
- [ ] MySQL 8, low-memory config, `bitewise` DB + user
- [ ] Node 22, pm2 (+ `pm2 startup`)
- [ ] Bun (per-user, needs `unzip`)

## 6. Backend `.env`

- [ ] `TRUST_PROXY_HOPS=2` (CloudFront + nginx)
- [ ] Other values: see `.env.example`

## 7. Certificate + CloudFront

- [ ] ACM cert (us-east-1, DNS validation); validation CNAME added at DNS provider
- [ ] Distribution: origin = EC2 public DNS, HTTP only; alias = domain
- [ ] Default behavior: caching disabled, all methods, AllViewer origin request policy
- [ ] `/_next/static/*` behavior: CachingOptimized
- [ ] DNS CNAME: domain to the distribution domain

## 8. Deploy

- [ ] How code gets onto the box (manual `git pull` + build, or CodeDeploy/CodePipeline)
- [ ] `bun run migration:run` before first start

## 9. Backups

- [ ] EBS daily snapshots (DLM), keep 7
- [ ] Nightly `mysqldump | gzip` to S3 `backups/`, 14-day expiry
- Restore: `aws s3 cp s3://<bucket>/backups/<file> - | gunzip | mysql bitewise`

## 10. Cost guard

- [ ] Budget alert (email)
- [ ] CloudWatch log groups (e.g. `/codebuild/bitewise`): set retention to 14 days after the first build creates it (default is never expire)

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

## Gotchas hit

-

## Differs from `infra/bitewise-stack.yaml`

-
