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

## Gotchas hit

-

## Differs from `infra/bitewise-stack.yaml`

-
