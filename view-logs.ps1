# Debug Log Viewer Script for PowerShell
# Usage: .\view-logs.ps1 [log-type] [options]

param(
    [Parameter(Position=0)]
    [ValidateSet("combined", "auth", "middleware", "api", "errors", "all")]
    [string]$LogType = "combined",
    
    [Parameter(Position=1)]
    [int]$Lines = 50,
    
    [switch]$Follow,
    [switch]$Search,
    [string]$Pattern = ""
)

$LogsDir = "logs"

function Show-Usage {
    Write-Host @"
Debug Log Viewer
================

Usage: .\view-logs.ps1 [log-type] [options]

Log Types:
  combined    - All logs (default)
  auth        - Authentication logs
  middleware  - Middleware and routing logs
  api         - API endpoint logs
  errors      - Error logs only
  all         - Show all log files

Options:
  -Lines <n>      Number of lines to show (default: 50)
  -Follow         Follow log file (like tail -f)
  -Search         Search mode
  -Pattern <str>  Search pattern

Examples:
  .\view-logs.ps1 auth
  .\view-logs.ps1 combined -Follow
  .\view-logs.ps1 errors -Lines 100
  .\view-logs.ps1 -Search -Pattern "admin@assetguard.io"
  
"@
}

# Check if logs directory exists
if (-not (Test-Path $LogsDir)) {
    Write-Host "❌ Logs directory not found. Have you started the application?" -ForegroundColor Red
    Write-Host "   Run: docker compose up" -ForegroundColor Yellow
    exit 1
}

# Search mode
if ($Search) {
    if ([string]::IsNullOrWhiteSpace($Pattern)) {
        Write-Host "❌ Please provide a search pattern with -Pattern" -ForegroundColor Red
        Show-Usage
        exit 1
    }
    
    Write-Host "🔍 Searching for: $Pattern" -ForegroundColor Cyan
    Write-Host ""
    
    Get-ChildItem "$LogsDir\*.log" | ForEach-Object {
        $matches = Select-String -Path $_.FullName -Pattern $Pattern
        if ($matches) {
            Write-Host "📄 $($_.Name):" -ForegroundColor Green
            $matches | ForEach-Object {
                Write-Host "  Line $($_.LineNumber): $($_.Line)"
            }
            Write-Host ""
        }
    }
    exit 0
}

# Get log file path
$LogFile = switch ($LogType) {
    "combined"   { "$LogsDir\combined.log" }
    "auth"       { "$LogsDir\auth.log" }
    "middleware" { "$LogsDir\middleware.log" }
    "api"        { "$LogsDir\api.log" }
    "errors"     { "$LogsDir\errors.log" }
    "all"        { "" }
}

# Show all logs
if ($LogType -eq "all") {
    Write-Host "📊 Available log files:" -ForegroundColor Cyan
    Write-Host ""
    
    Get-ChildItem "$LogsDir\*.log" | ForEach-Object {
        $size = [math]::Round($_.Length / 1KB, 2)
        $modified = $_.LastWriteTime.ToString("yyyy-MM-dd HH:mm:ss")
        Write-Host ("  {0,-20} {1,8} KB    Modified: {2}" -f $_.Name, $size, $modified)
    }
    Write-Host ""
    Write-Host "💡 Tip: Use '.\view-logs.ps1 <log-type>' to view a specific log" -ForegroundColor Yellow
    exit 0
}

# Check if file exists
if (-not (Test-Path $LogFile)) {
    Write-Host "⚠️  Log file not found: $LogFile" -ForegroundColor Yellow
    Write-Host "   The file will be created when the application generates logs." -ForegroundColor Gray
    exit 1
}

# Display log file
Write-Host "📄 Viewing: $LogType.log" -ForegroundColor Cyan
Write-Host "───────────────────────────────────────────────────────────────" -ForegroundColor Gray

if ($Follow) {
    Write-Host "👀 Following log file (Ctrl+C to stop)..." -ForegroundColor Yellow
    Write-Host ""
    Get-Content $LogFile -Wait -Tail $Lines
} else {
    Get-Content $LogFile -Tail $Lines
}
