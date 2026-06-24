[CmdletBinding()]
param(
  [switch]$AlsoKillDefaultPorts
)

$ErrorActionPreference = "Stop"

$Root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$LogDir = Join-Path $Root ".tunnel-logs"
$SessionFile = Join-Path $LogDir "public-session.json"

function Stop-ProcessTree([int]$ProcessId) {
  if ($ProcessId -le 0) {
    return
  }
  $process = Get-Process -Id $ProcessId -ErrorAction SilentlyContinue
  if (-not $process) {
    return
  }
  Write-Host "Stopping PID $ProcessId ..." -ForegroundColor Yellow
  & taskkill.exe /PID $ProcessId /T /F | Out-Null
}

if (Test-Path $SessionFile) {
  $session = Get-Content -Raw -LiteralPath $SessionFile | ConvertFrom-Json
  foreach ($item in @($session.processes)) {
    Stop-ProcessTree ([int]$item.pid)
  }
  Remove-Item -LiteralPath $SessionFile -Force -ErrorAction SilentlyContinue
  Write-Host "Saved public session stopped." -ForegroundColor Green
} else {
  Write-Host "No saved public session found." -ForegroundColor DarkYellow
}

if ($AlsoKillDefaultPorts) {
  foreach ($port in @(4011, 5174)) {
    $listeners = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
    foreach ($pid in ($listeners | Select-Object -ExpandProperty OwningProcess -Unique)) {
      Stop-ProcessTree ([int]$pid)
    }
  }
}
