#!/bin/sh
set -e

# Ensure prisma directory exists
mkdir -p /app/prisma

# If dev.db does not exist in the volume (first startup on server), copy seeded database
if [ ! -f /app/prisma/dev.db ]; then
  echo "🚀 [Kalis Cloud] No database found in volume. Initializing database..."
  if [ -f /app/prisma_seed/dev.db ]; then
    cp /app/prisma_seed/dev.db /app/prisma/dev.db
    echo "✅ [Kalis Cloud] Successfully seeded 8 universities and 721 academic programs!"
  fi
fi

# Ensure permissions
chmod -R 777 /app/prisma 2>/dev/null || true

echo "✨ [Kalis Cloud] Starting Kalis Next.js server on port 3000..."
exec node server.js
