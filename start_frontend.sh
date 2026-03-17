#!/bin/bash
cd frontend
pnpm dev --port 3004 > frontend.log 2>&1 &
echo $! > frontend.pid
