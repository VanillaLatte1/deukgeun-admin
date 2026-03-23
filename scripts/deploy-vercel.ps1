param(
    [string]$Alias
)

$ErrorActionPreference = "Stop"

function Require-Command {
    param(
        [string]$Command
    )

    $null = Get-Command $Command -ErrorAction Stop
}

Write-Host "[1/4] Checking prerequisites..."

if (-not (Test-Path ".env")) {
    throw "Missing .env file. Create .env before deploying."
}

Require-Command npm
Require-Command npx

Write-Host "[2/4] Running production build..."
npm run build
if ($LASTEXITCODE -ne 0) {
    throw "Build failed. Fix the errors and try again."
}

Write-Host "[3/4] Deploying to Vercel production..."
$deployOutput = npx vercel deploy --prod --yes
if ($LASTEXITCODE -ne 0) {
    throw "Vercel deployment failed."
}

$deployUrl = $deployOutput | Select-String -Pattern '^https://.*$' | Select-Object -Last 1
if (-not $deployUrl) {
    throw "Deployment did not return a deployment URL."
}

$deployment = $deployUrl.ToString().Trim()
Write-Host "Deployment URL: $deployment"

if ($Alias) {
    Write-Host "[4/4] Assigning alias $Alias ..."
    npx vercel alias set $deployment $Alias
    if ($LASTEXITCODE -ne 0) {
        throw "Alias assignment failed."
    }
} else {
    Write-Host "[4/4] Alias step skipped."
}

Write-Host "Done."
