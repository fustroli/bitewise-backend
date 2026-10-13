#!/bin/bash
set -e
cd /home/ubuntu/bitewise-backend
node_modules/.bin/typeorm migration:run -d dist/database/data-source.js
