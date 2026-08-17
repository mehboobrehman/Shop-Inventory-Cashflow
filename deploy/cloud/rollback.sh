#!/bin/bash
# Simple rollback script: expects a git commit hash or branch name as argument

if [ -z "$1" ]; then
    echo "Usage: $0 <commit-hash>"
    exit 1
fi

echo "Rolling back to version $1..."
git fetch
git checkout $1
bun install
bun run build
cd server
# Warning: Prisma migrations might not rollback easily unless prisma db pull or manual rollback is used.
# If rollback involves schema changes, consider manual intervention.
cd ..
pm2 reload pm2.config.js

echo "Rollback complete."
