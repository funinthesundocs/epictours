# Database Migration PowerShell Script
# Usage: .\scripts\db-migrate.ps1 database\38_drop_redundant_columns.sql

param(
    [Parameter(Mandatory=$true)]
    [string]$SqlFile
)

# Load .env.local
$envFile = Join-Path $PSScriptRoot "..\\.env.local"
if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        if ($_ -match '^([^=]+)=(.*)$') {
            [Environment]::SetEnvironmentVariable($matches[1], $matches[2], "Process")
        }
    }
}

$dbUrl = $env:DATABASE_URL
if (-not $dbUrl) {
    Write-Host "ERROR: DATABASE_URL not found in .env.local" -ForegroundColor Red
    Write-Host "Add this line to .env.local:" -ForegroundColor Yellow
    Write-Host 'DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.gtzpspdtdnkjoblbvzxo.supabase.co:5432/postgres'
    exit 1
}

$psqlPath = "C:\Program Files\PostgreSQL\17\bin\psql.exe"
if (-not (Test-Path $psqlPath)) {
    Write-Host "ERROR: psql not found at $psqlPath" -ForegroundColor Red
    exit 1
}

$fullPath = Resolve-Path $SqlFile -ErrorAction SilentlyContinue
if (-not $fullPath) {
    Write-Host "ERROR: SQL file not found: $SqlFile" -ForegroundColor Red
    exit 1
}

Write-Host "Running: $SqlFile" -ForegroundColor Cyan
Write-Host "---" -ForegroundColor Gray

& $psqlPath $dbUrl -f $fullPath

if ($LASTEXITCODE -eq 0) {
    Write-Host "---" -ForegroundColor Gray
    Write-Host "Migration completed successfully!" -ForegroundColor Green
} else {
    Write-Host "Migration failed with exit code: $LASTEXITCODE" -ForegroundColor Red
}
