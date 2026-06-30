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

function Get-UrlFromLine {
    param(
        [string]$Line
    )

    if ($Line -match '(https://[^\s\[]+)') {
        return $matches[1]
    }

    return $null
}

function Get-DeploymentUrl {
    param(
        [string[]]$Lines
    )

    $productionLine = $Lines |
        Where-Object { $_ -match 'Production:\s+https://[^\s]+' } |
        Select-Object -Last 1

    if ($productionLine) {
        $productionUrl = Get-UrlFromLine -Line $productionLine
        if ($productionUrl) {
            return $productionUrl
        }
    }

    $deploymentPattern = 'https://[a-z0-9-]+-[a-z0-9]+-[a-z0-9-]+\.vercel\.app'
    $deploymentLine = $Lines |
        Where-Object { $_ -match $deploymentPattern } |
        Select-Object -Last 1

    if ($deploymentLine) {
        $deploymentUrl = Get-UrlFromLine -Line $deploymentLine
        if ($deploymentUrl) {
            return $deploymentUrl
        }
    }

    $genericLine = $Lines |
        Where-Object { $_ -match 'https://[^\s]+\.vercel\.app' } |
        Select-Object -Last 1

    if ($genericLine) {
        return Get-UrlFromLine -Line $genericLine
    }

    return $null
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
$deployOutput = npx vercel deploy --prod --yes 2>&1
if ($LASTEXITCODE -ne 0) {
    throw "Vercel deployment failed."
}

$deployLines = @($deployOutput | ForEach-Object { "$_" })
$deployment = Get-DeploymentUrl -Lines $deployLines

if (-not $deployment) {
    throw "Deployment did not return a deployment URL."
}

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
