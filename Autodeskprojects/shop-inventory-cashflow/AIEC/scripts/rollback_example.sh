#!/bin/bash
# AIEC v3.0 Standard Rollback Script
# Usage: ./scripts/rollback.sh <service_name> <previous_image_tag>

echo "🔴 Starting emergency rollback for service: $1"
echo "Step 1: Draining traffic from current deployment..."
kubectl rollout pause deployment/$1 2>/dev/null || echo "Error pausing deployment (proceeding anyway)"

echo "Step 2: Reverting to previous image tag: $2"
kubectl set image deployment/$1 $1=$2 --record

echo "Step 3: Resuming rollout and monitoring health..."
kubectl rollout resume deployment/$1
kubectl rollout status deployment/$1 --timeout=5m

if [ $? -eq 0 ]; then
    echo "✅ Rollback successful! Service is healthy."
else
    echo "❌ Rollback failed! Manual intervention required."
    exit 1
fi