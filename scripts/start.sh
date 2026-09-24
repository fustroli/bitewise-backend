#!/bin/bash
cd /home/ubuntu/bitewise-backend
pm2 delete bitewise-backend || true
pm2 start dist/main.js --name bitewise-backend --node-args="--max-old-space-size=256"
pm2 save
