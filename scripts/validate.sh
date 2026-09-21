#!/bin/bash
sleep 5
curl -s -o /dev/null http://localhost:8000 || exit 1
