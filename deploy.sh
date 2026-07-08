#!/usr/bin/env bash
set -euo pipefail

GITHUB_USER="${1:-}"
REPO_NAME="${2:-tarifa-wind}"
BRANCH="${BRANCH:-main}"

if [[ -z "$GITHUB_USER" ]]; then
  echo "Usage: ./deploy.sh YOUR_GITHUB_USERNAME [repo-name]"
  echo "Example: ./deploy.sh ericmitha tarifa-wind"
  exit 1
fi

if ! command -v git >/dev/null 2>&1; then
  echo "git is not installed. Run: xcode-select --install"
  exit 1
fi

if [[ ! -f "package.json" || ! -f ".github/workflows/deploy-production.yml" ]]; then
  echo "Run this from the project root."
  exit 1
fi

if [[ ! -d ".git" ]]; then
  git init
  git checkout -b "$BRANCH"
fi

git add .
if ! git diff --cached --quiet; then
  git commit -m "Initial stable Tarifa Wind app"
fi

REMOTE_URL="https://github.com/${GITHUB_USER}/${REPO_NAME}.git"

if command -v gh >/dev/null 2>&1; then
  if ! gh repo view "${GITHUB_USER}/${REPO_NAME}" >/dev/null 2>&1; then
    gh repo create "${GITHUB_USER}/${REPO_NAME}" --public --source=. --remote=origin --push=false
  fi
else
  echo "GitHub CLI not found. Recommended:"
  echo "brew install gh && gh auth login"
fi

if git remote get-url origin >/dev/null 2>&1; then
  git remote set-url origin "$REMOTE_URL"
else
  git remote add origin "$REMOTE_URL"
fi

git push -u origin "$BRANCH"

echo
echo "Pushed branch: $BRANCH"
echo "Enable GitHub Pages: https://github.com/${GITHUB_USER}/${REPO_NAME}/settings/pages"
echo "Source: GitHub Actions"
echo
echo "App:  https://${GITHUB_USER}.github.io/${REPO_NAME}/"
echo "iCal: https://${GITHUB_USER}.github.io/${REPO_NAME}/tarifa-wind.ics"
