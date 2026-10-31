# GearShift - Run dev server (works when npm is not in PATH)
$nodeDir = "C:\Program Files\nodejs"
$env:Path = "$nodeDir;$env:Path"

Set-Location $PSScriptRoot

Write-Host "Installing dependencies (if needed)..." -ForegroundColor Cyan
& "$nodeDir\npm.cmd" install
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "`nStarting Next.js dev server..." -ForegroundColor Green
Write-Host "Open http://localhost:3000 in your browser`n" -ForegroundColor Yellow
& "$nodeDir\npm.cmd" run dev
