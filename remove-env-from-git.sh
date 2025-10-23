#!/bin/bash
set -e

echo "🔒 Removing .env files from Git history..."
echo ""
echo "⚠️  This will:"
echo "   - Rewrite git history"
echo "   - Require force push"
echo "   - Require team to re-clone"
echo ""
read -p "Continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Cancelled."
    exit 0
fi

# Backup
echo "Creating backup branch..."
git branch backup-$(date +%Y%m%d-%H%M%S) 2>/dev/null || true

# Remove from history
echo "Removing .env files from history..."
git filter-branch --force --index-filter \
  'git rm --cached --ignore-unmatch backend/.env frontend/.env' \
  --prune-empty --tag-name-filter cat -- --all

# Cleanup
echo "Cleaning up..."
rm -rf .git/refs/original/
git reflog expire --expire=now --all
git gc --prune=now --aggressive

echo ""
echo "✅ Done! Next steps:"
echo "1. ROTATE ALL SECRETS in your .env files"
echo "2. Run: git push origin --force --all"
echo "3. Team members must re-clone the repo"

