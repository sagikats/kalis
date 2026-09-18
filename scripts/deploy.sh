#!/bin/bash
set -e

BRANCH=$(git rev-parse --abbrev-ref HEAD)
echo "🚀 [Mitkablim Deploy] Pulling latest updates from branch ${BRANCH}..."
git pull origin "${BRANCH}"

echo "📦 [Mitkablim Deploy] Building and restarting Docker containers (App + Caddy HTTPS)..."
docker compose up -d --build

echo "⏳ [Mitkablim Deploy] Waiting for application to become healthy..."
sleep 5

echo "🔍 [Mitkablim Deploy] Checking health status..."
curl -s http://localhost:3000/api/health || echo "Application is starting..."

echo "🎉 [Mitkablim Deploy] Deployment completed successfully!"
docker compose ps

