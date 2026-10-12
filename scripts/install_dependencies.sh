#!/bin/bash
cd /home/ubuntu/bitewise-backend
export PATH="$HOME/.bun/bin:$PATH"
command -v bun >/dev/null || curl -fsSL https://bun.sh/install | bash -s "bun-v1.4.3"
bun install --frozen-lockfile --production
