$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

Set-Location (Join-Path $PSScriptRoot '..')

if (-not (Get-Command pm2 -ErrorAction SilentlyContinue)) {
  Write-Host 'Installing PM2 globally...'
  npm install -g pm2
}

Write-Host 'Starting/reloading API under PM2...'
pm2 startOrReload .\api\ecosystem.local.cjs
pm2 save

Write-Host 'PM2 status:'
pm2 status

Write-Host ''
Write-Host 'Health check:'
try {
  (Invoke-WebRequest -UseBasicParsing -Uri 'http://localhost:4000/health' -TimeoutSec 15).Content
} catch {
  Write-Host $_.Exception.Message
}
