#!/bin/bash
# ShredUp - Quick Deployment Script
# Usage: ./deploy.sh [production|staging]

set -e  # Exit on error

echo "🚀 ShredUp Deployment Script"
echo "=============================="
echo ""

# Check if wrangler is available
if ! command -v npx wrangler &> /dev/null; then
    echo "❌ Error: wrangler not found"
    echo "Run: npm install -g wrangler"
    exit 1
fi

# Build project
echo "📦 Building project..."
npm run build

if [ ! -d "dist" ]; then
    echo "❌ Error: dist/ directory not found after build"
    exit 1
fi

echo "✅ Build complete"
echo ""

# Get project name from environment or use default
PROJECT_NAME="${CLOUDFLARE_PROJECT_NAME:-shredup-app}"
echo "📋 Project name: $PROJECT_NAME"
echo ""

# Deploy
ENVIRONMENT="${1:-production}"

if [ "$ENVIRONMENT" = "production" ]; then
    echo "🌐 Deploying to PRODUCTION..."
    npx wrangler pages deploy dist --project-name "$PROJECT_NAME" --branch main
elif [ "$ENVIRONMENT" = "staging" ]; then
    echo "🧪 Deploying to STAGING..."
    npx wrangler pages deploy dist --project-name "$PROJECT_NAME" --branch staging
else
    echo "❌ Error: Invalid environment '$ENVIRONMENT'"
    echo "Usage: ./deploy.sh [production|staging]"
    exit 1
fi

echo ""
echo "✅ Deployment complete!"
echo "🔗 URL: https://$PROJECT_NAME.pages.dev"
echo ""
