#!/bin/bash
set -e

echo "🚀 [Kalis Deploy] Pulling latest updates from branch up-to-cloude..."
git pull origin up-to-cloude

echo "📦 [Kalis Deploy] Building and restarting Docker containers..."
docker compose up -d --build

echo "⏳ [Kalis Deploy] Waiting for application to become healthy..."
sleep 5

echo "🔍 [Kalis Deploy] Checking health status..."
curl -s http://localhost:3000/api/health || echo "Application is starting..."

echo "🎉 [Kalis Deploy] Deployment completed successfully!"
docker compose ps
