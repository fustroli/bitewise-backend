#!/bin/bash
for i in $(seq 1 10); do
  curl -sf http://localhost:8000/health/ready -o /dev/null && exit 0
  sleep 3
done
exit 1
