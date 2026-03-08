#!/bin/bash
# ShredUp - Auto Restore Script
# Détecte si le projet existe et le restaure si nécessaire

set -e  # Exit on error

WEBAPP_DIR="/home/user/webapp"
GITHUB_REPO="https://github.com/YASUai/shredup-app.git"
BACKUP_URL="https://www.genspark.ai/api/files/s/7jlXTsHq"

echo "🔍 Checking ShredUp project status..."

# Check if webapp exists
if [ -d "$WEBAPP_DIR" ]; then
    echo "✅ Project exists at $WEBAPP_DIR"
    
    # Check if it's a git repo
    if [ -d "$WEBAPP_DIR/.git" ]; then
        echo "✅ Git repository found"
        
        # Check git status
        cd "$WEBAPP_DIR"
        BRANCH=$(git branch --show-current)
        echo "📋 Current branch: $BRANCH"
        
        # Pull latest changes
        echo "🔄 Pulling latest changes..."
        git pull origin "$BRANCH" || echo "⚠️  Pull failed (may be up to date)"
        
    else
        echo "⚠️  Not a git repository, may need manual inspection"
    fi
    
    # Check if node_modules exists
    if [ ! -d "$WEBAPP_DIR/node_modules" ]; then
        echo "📦 Installing dependencies..."
        cd "$WEBAPP_DIR"
        npm install
    else
        echo "✅ Dependencies installed"
    fi
    
    # Check if dist exists
    if [ ! -d "$WEBAPP_DIR/dist" ]; then
        echo "🔨 Building project..."
        cd "$WEBAPP_DIR"
        npm run build
    else
        echo "✅ Build exists"
    fi
    
else
    echo "❌ Project not found at $WEBAPP_DIR"
    echo "🔄 Restoring from GitHub..."
    
    cd /home/user
    
    # Try GitHub first
    if git clone "$GITHUB_REPO" webapp; then
        echo "✅ Cloned from GitHub"
        
        cd webapp
        
        echo "📦 Installing dependencies..."
        npm install
        
        echo "🔨 Building project..."
        npm run build
        
        echo "✅ Project restored successfully!"
        
    else
        echo "⚠️  GitHub clone failed, trying backup CDN..."
        
        # Fallback to CDN backup
        if wget "$BACKUP_URL" -O shredup-backup.tar.gz; then
            echo "✅ Downloaded backup"
            
            tar -xzf shredup-backup.tar.gz
            rm shredup-backup.tar.gz
            
            cd webapp
            
            echo "📦 Installing dependencies..."
            npm install
            
            echo "✅ Project restored from backup!"
            
        else
            echo "❌ Failed to restore project"
            exit 1
        fi
    fi
fi

# Start PM2 if not running
echo "🚀 Checking PM2 status..."
cd "$WEBAPP_DIR"

if pm2 list | grep -q "webapp"; then
    echo "✅ PM2 process exists"
    pm2 restart webapp
    echo "🔄 Restarted webapp"
else
    echo "🚀 Starting webapp with PM2..."
    pm2 start ecosystem.config.cjs
fi

echo ""
echo "✅ ShredUp is ready!"
echo "📋 Project: $WEBAPP_DIR"
echo "🌐 Sandbox URL: https://3000-{sandbox-id}.sandbox.novita.ai"
echo "🌍 Production URL: https://0b596d24-c79c-4659-a359-785995cb196d.vip.gensparksite.com"
echo ""
