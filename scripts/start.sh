#!/bin/bash
cd /home/ubuntu/bitewise-backend
pm2 start dist/main.js --name bitewise-backend || pm2 restart bitewise-backend
