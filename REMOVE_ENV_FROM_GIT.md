# Remove .env Files from Git History

Your .env files were committed to git. Here's how to remove them completely:

## Quick Method (Recommended)

```bash
# 1. Install git-filter-repo
pip3 install git-filter-repo
# OR
brew install git-filter-repo

# 2. Create backup
git branch backup-before-cleanup

# 3. Remove .env files from entire history
git filter-repo --path backend/.env --path frontend/.env --invert-paths --force

# 4. Force push to remote (WARNING: rewrites history)
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push origin --force --all
git push origin --force --tags
```

## Alternative Method (Using BFG)

```bash
# 1. Install BFG Repo Cleaner
brew install bfg
# OR download from: https://rtyley.github.io/bfg-repo-cleaner/

# 2. Create backup
git branch backup-before-cleanup

# 3. Remove .env files
bfg --delete-files .env

# 4. Clean up
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# 5. Force push
git push origin --force --all
```

## Manual Method (No tools needed)

```bash
# 1. Create backup
git branch backup-before-cleanup

# 2. Remove from history
git filter-branch --force --index-filter \
  'git rm --cached --ignore-unmatch backend/.env frontend/.env' \
  --prune-empty --tag-name-filter cat -- --all

# 3. Clean up
rm -rf .git/refs/original/
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# 4. Force push
git push origin --force --all
git push origin --force --tags
```

## After Removal - CRITICAL STEPS

### 1. Rotate ALL Secrets Immediately
Your secrets are now public in git history. Change:
- MongoDB credentials
- JWT secret key
- Stripe API keys
- Cloudinary credentials

### 2. Update .env Files
```bash
# Backend
cd backend
cp .env.example .env
# Fill in NEW credentials

# Frontend
cd frontend
cp .env.example .env
# Fill in NEW credentials
```

### 3. Verify Removal
```bash
# Check if .env still in history
git log --all --full-history -- "*/.env"
# Should return nothing

# Check current tracking
git ls-files | grep .env
# Should return nothing
```

### 4. Team Coordination
If working with a team:
- Notify everyone before force pushing
- Everyone must re-clone the repository
- Share new credentials securely (NOT via git)

## Prevention

The pre-commit hook in `.husky/pre-commit` will prevent future commits of .env files.

## Need Help?

If you encounter issues:
1. Check backup branch: `git checkout backup-before-cleanup`
2. Restore if needed: `git reset --hard backup-before-cleanup`
3. Try alternative method above
