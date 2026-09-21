# ============================================
# AMERO — One-command deploy
# GitHub Pages (static site) + Cloudflare Worker (order API)
# ============================================
# Runs from an internet-connected machine with Node.js 18+ and git.
# It will:
#   1. Commit & push the site to GitHub (Pages must be enabled once in settings)
#   2. Install Wrangler, deploy the Worker, set the Telegram secrets
#   3. Write the Worker URL into js/config.js and push again
#   4. Try to enable GitHub Pages automatically (falls back to manual steps)
#
# Usage:
#   powershell -ExecutionPolicy Bypass -File scripts/deploy.ps1
#
# Optional overrides (set before running):
#   $env:WORKER_NAME = "amero-api"          # unique worker name
#   $env:TELEGRAM_BOT_TOKEN = "..."         # skip the interactive prompt
#   $env:TELEGRAM_CHAT_ID = "..."           # skip the interactive prompt
# ============================================

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

function Step($msg) { Write-Host "`n=== $msg ===" -ForegroundColor Cyan }

# ---------- 1. Node / git preflight ----------
node --version | Out-Null
if (-not $?) { Write-Error 'Node.js is required (18+).' }
git --version | Out-Null
if (-not $?) { Write-Error 'git is required.' }

# Catalog drift guard: the display catalog (js/app.js) and the validation
# catalogs (server/catalog.js + worker/worker.mjs) must agree before shipping.
node scripts/check-catalog.mjs
if ($LASTEXITCODE -ne 0) { Write-Error 'Catalog drift detected — sync js/app.js, server/catalog.js, and worker/worker.mjs before deploying.' }

$branch = git rev-parse --abbrev-ref HEAD
Write-Host "Pushing branch '$branch' from '$root'"

git add -A
git commit -m "Deploy Amero storefront: pages + worker backend" | Out-Null
git push -u origin $branch
if ($LASTEXITCODE -ne 0) {
  Write-Warning 'git push failed (credentials?). Authenticate (git credential-manager or a PAT) and re-run.'
}

# ---------- 2. Cloudflare Worker ----------
Step 'Cloudflare Worker'
if (-not (Get-Command wrangler -ErrorAction SilentlyContinue)) {
  npm install -g wrangler
}

wrangler whoami
if ($LASTEXITCODE -ne 0) {
  Write-Host 'Logging into Cloudflare (a browser window will open)…'
  wrangler login
}

$workerName = if ($env:WORKER_NAME) { $env:WORKER_NAME } else { 'amero-api' }

# Deploy and capture the workers.dev URL (patch name into wrangler.toml first)
$toml = Join-Path $root 'worker/wrangler.toml'
(Get-Content $toml -Raw) -replace '(?m)^name = ".*"', "name = `"$workerName`"" | Set-Content $toml -NoNewline

Set-Location (Join-Path $root 'worker')
$deployOut = wrangler deploy 2>&1
$deployOut | Write-Host
$workerUrl = ($deployOut | Select-String -Pattern 'https://[a-z0-9-]+\.workers\.dev' | Select-Object -Last 1).Matches[0].Value
if (-not $workerUrl) { Write-Error 'Could not detect the Worker URL from `wrangler deploy` output.' }

# ---------- 3. Secrets ----------
Step 'Setting Telegram secrets'
if (Test-Path env:TELEGRAM_BOT_TOKEN) {
  $token = $env:TELEGRAM_BOT_TOKEN
} else {
  $token = Read-Host 'Telegram bot token' -AsSecureString
  if ($null -ne $token) { $token = (New-Object System.Net.NetworkCredential '', $token).Password }
}
if (-not $token) { Write-Warning 'Skipping TELEGRAM_BOT_TOKEN (orders will record but not notify).' }
else { "$token" | wrangler secret put TELEGRAM_BOT_TOKEN }

if (Test-Path env:TELEGRAM_CHAT_ID) {
  $chatId = $env:TELEGRAM_CHAT_ID
} else {
  $chatId = Read-Host 'Telegram chat/channel ID' -AsSecureString
  if ($null -ne $chatId) { $chatId = (New-Object System.Net.NetworkCredential '', $chatId).Password }
}
if (-not $chatId) { Write-Warning 'Skipping TELEGRAM_CHAT_ID.' }
else { "$chatId" | wrangler secret put TELEGRAM_CHAT_ID }

# ---------- 4. Point the storefront at the Worker ----------
Step 'Wiring the site to the Worker'
Set-Location $root
$config = Join-Path $root 'js/config.js'
(Get-Content $config -Raw) -replace "const PROD_ORDER_API_URL = '[^']*';", "const PROD_ORDER_API_URL = '$workerUrl';" | Set-Content $config -NoNewline
Write-Host "PROD_ORDER_API_URL set to $workerUrl"

git add js/config.js
git commit -m 'Point checkout at deployed Cloudflare Worker order API' | Out-Null
git push origin $branch
if ($LASTEXITCODE -ne 0) { Write-Warning 'Final push failed — re-run git push once authenticated.' }

# ---------- 5. GitHub Pages ----------
Step 'GitHub Pages'
$remote = git remote get-url origin
$repo = ($remote -replace '^.*github\.com[:/]([^/]+)/([^/]+?)(\.git)?$', '$1/$2')
if ($repo -match ' ' -or $repo -eq $remote) { $repo = '' }
$pagesUrl = if ($repo) { 'https://' + ($repo -replace '/', '.github.io/') } else { '<pages-url>' }
if (Get-Command gh -ErrorAction SilentlyContinue) {
  gh auth status 2>$null | Out-Null
  if ($?) {
    gh api "repos/$repo/pages" -X POST -f 'source[branch]=main' -f 'source[path]=/' 2>$null | Out-Null
    if ($?) { Write-Host 'GitHub Pages enabled from branch "main" / root.' }
    else { Write-Host 'GitHub Pages may already be enabled.' }
  }
}

Write-Host @"

============================================================
 Deploy summary
============================================================
 Worker URL : $workerUrl
 Secrets    : TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID set
 API check  : $workerUrl  (should return {\"ok\":true,\"service\":...})

 If Pages did not enable automatically:
   GitHub repo -> Settings -> Pages -> Deploy from branch
   Branch: main, folder: / (root) -> Save
   Your site will be at  $pagesUrl

 Done. Re-run this script any time to redeploy.
============================================================
"@