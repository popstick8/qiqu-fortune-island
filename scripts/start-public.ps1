[CmdletBinding()]
param(
  [ValidateSet("cloudflare", "custom")]
  [string]$Mode = "cloudflare",

  [int]$ServerPort = 4011,
  [int]$ClientPort = 5174,

  [string]$PublicServerUrl = "",
  [string]$PublicClientUrl = "",

  [switch]$NoOpen,
  [switch]$KeepExisting
)

$ErrorActionPreference = "Stop"

$Root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$LogDir = Join-Path $Root ".tunnel-logs"
$SessionFile = Join-Path $LogDir "public-session.json"
New-Item -ItemType Directory -Force -Path $LogDir | Out-Null

function Write-Step([string]$Message) {
  Write-Host ""
  Write-Host "==> $Message" -ForegroundColor Cyan
}

function Normalize-PublicUrl([string]$Url) {
  $clean = $Url.Trim()
  if (-not $clean) {
    return ""
  }
  if ($clean -notmatch "^https?://") {
    $clean = "http://$clean"
  }
  return $clean.TrimEnd("/")
}

function Stop-ProcessTree([int]$ProcessId) {
  if ($ProcessId -le 0) {
    return
  }
  $process = Get-Process -Id $ProcessId -ErrorAction SilentlyContinue
  if (-not $process) {
    return
  }
  & taskkill.exe /PID $ProcessId /T /F | Out-Null
}

function Stop-SavedSession {
  if ($KeepExisting -or -not (Test-Path $SessionFile)) {
    return
  }

  Write-Step "Stopping previous public session"
  try {
    $session = Get-Content -Raw -LiteralPath $SessionFile | ConvertFrom-Json
    foreach ($item in @($session.processes)) {
      Stop-ProcessTree ([int]$item.pid)
    }
  } catch {
    Write-Warning "Could not read previous session: $($_.Exception.Message)"
  }
  Remove-Item -LiteralPath $SessionFile -Force -ErrorAction SilentlyContinue
}

function Assert-PortFree([int]$Port, [string]$Name) {
  $listeners = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
  if ($listeners) {
    $pids = ($listeners | Select-Object -ExpandProperty OwningProcess -Unique) -join ", "
    throw "${Name} port ${Port} is already in use. PID: ${pids}. Run scripts\stop-public.ps1 or choose another port."
  }
}

function New-ChildScript([string]$Name, [string]$Body) {
  $path = Join-Path $LogDir "${Name}.ps1"
  Set-Content -LiteralPath $path -Value $Body -Encoding UTF8
  return $path
}

function Start-LoggedPowerShell([string]$Name, [string]$Body) {
  $scriptPath = New-ChildScript $Name $Body
  $outLog = Join-Path $LogDir "${Name}.out.log"
  $errLog = Join-Path $LogDir "${Name}.err.log"
  Remove-Item -LiteralPath $outLog, $errLog -Force -ErrorAction SilentlyContinue

  $process = Start-Process `
    -FilePath powershell.exe `
    -ArgumentList @("-NoProfile", "-ExecutionPolicy", "Bypass", "-File", $scriptPath) `
    -WindowStyle Hidden `
    -RedirectStandardOutput $outLog `
    -RedirectStandardError $errLog `
    -PassThru

  return [pscustomobject]@{
    name = $Name
    pid = $process.Id
    outLog = $outLog
    errLog = $errLog
  }
}

function Wait-Http([string]$Url, [int]$Seconds = 40) {
  $deadline = (Get-Date).AddSeconds($Seconds)
  do {
    try {
      $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 4
      if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 500) {
        return
      }
    } catch {
      Start-Sleep -Milliseconds 900
    }
  } while ((Get-Date) -lt $deadline)

  throw "Timed out waiting for ${Url}."
}

function Get-CloudflaredPath {
  $command = Get-Command cloudflared -ErrorAction SilentlyContinue
  if (-not $command) {
    throw "cloudflared was not found. Install Cloudflare Tunnel or use -Mode custom with Sakura mapping URLs."
  }
  return $command.Source
}

function Start-CloudflareTunnel([string]$Name, [string]$LocalUrl) {
  $cloudflared = Get-CloudflaredPath
  $outLog = Join-Path $LogDir "${Name}.out.log"
  $errLog = Join-Path $LogDir "${Name}.err.log"
  Remove-Item -LiteralPath $outLog, $errLog -Force -ErrorAction SilentlyContinue

  $process = Start-Process `
    -FilePath $cloudflared `
    -ArgumentList @("tunnel", "--url", $LocalUrl, "--no-autoupdate") `
    -WindowStyle Hidden `
    -RedirectStandardOutput $outLog `
    -RedirectStandardError $errLog `
    -PassThru

  $deadline = (Get-Date).AddSeconds(45)
  $publicUrl = ""
  do {
    $text = ""
    if (Test-Path $outLog) {
      $text += (Get-Content -Raw -LiteralPath $outLog -ErrorAction SilentlyContinue)
    }
    if (Test-Path $errLog) {
      $text += "`n" + (Get-Content -Raw -LiteralPath $errLog -ErrorAction SilentlyContinue)
    }
    $match = [regex]::Match($text, "https://[a-zA-Z0-9-]+\.trycloudflare\.com")
    if ($match.Success) {
      $publicUrl = $match.Value.TrimEnd("/")
      break
    }
    Start-Sleep -Milliseconds 900
  } while ((Get-Date) -lt $deadline)

  if (-not $publicUrl) {
    Stop-ProcessTree $process.Id
    throw "Cloudflare did not return a public URL. Check log: ${errLog}"
  }

  return [pscustomobject]@{
    name = $Name
    pid = $process.Id
    outLog = $outLog
    errLog = $errLog
    publicUrl = $publicUrl
  }
}

Stop-SavedSession
Assert-PortFree $ServerPort "Server"
Assert-PortFree $ClientPort "Client"

$PublicServerUrl = Normalize-PublicUrl $PublicServerUrl
$PublicClientUrl = Normalize-PublicUrl $PublicClientUrl
$processes = @()

if ($Mode -eq "custom" -and -not $PublicServerUrl) {
  throw "Custom mode requires -PublicServerUrl."
}

$serverOrigin = if ($Mode -eq "custom" -and $PublicClientUrl) { $PublicClientUrl } else { "*" }
$escapedRoot = $Root.Replace("'", "''")

Write-Step "Starting server on localhost:${ServerPort}"
$serverScript = @"
`$env:PORT = '$ServerPort'
`$env:CLIENT_ORIGIN = '$serverOrigin'
Set-Location -LiteralPath '$escapedRoot'
npm.cmd --workspace server run dev
"@
$server = Start-LoggedPowerShell "public-server-$ServerPort" $serverScript
$processes += $server
Wait-Http "http://localhost:$ServerPort/health" 45

if ($Mode -eq "cloudflare") {
  Write-Step "Creating backend Cloudflare tunnel"
  $backendTunnel = Start-CloudflareTunnel "cloudflared-backend-$ServerPort" "http://localhost:$ServerPort"
  $processes += $backendTunnel
  $PublicServerUrl = $backendTunnel.publicUrl
}

Write-Step "Checking public backend: $PublicServerUrl"
Wait-Http "$PublicServerUrl/health" 45

Write-Step "Starting client on localhost:${ClientPort}"
$escapedClientPath = (Join-Path $Root "client").Replace("'", "''")
$clientScript = @"
`$env:VITE_SERVER_URL = '$PublicServerUrl'
Set-Location -LiteralPath '$escapedClientPath'
npx.cmd vite --host 0.0.0.0 --port $ClientPort
"@
$client = Start-LoggedPowerShell "public-client-$ClientPort" $clientScript
$processes += $client
Wait-Http "http://localhost:$ClientPort" 45

if ($Mode -eq "cloudflare") {
  Write-Step "Creating frontend Cloudflare tunnel"
  $frontendTunnel = Start-CloudflareTunnel "cloudflared-frontend-$ClientPort" "http://localhost:$ClientPort"
  $processes += $frontendTunnel
  $PublicClientUrl = $frontendTunnel.publicUrl
}

$localClientUrl = "http://localhost:$ClientPort"
$shareUrl = if ($PublicClientUrl) { $PublicClientUrl } else { $localClientUrl }

$session = [pscustomobject]@{
  mode = $Mode
  startedAt = (Get-Date).ToString("s")
  serverPort = $ServerPort
  clientPort = $ClientPort
  publicServerUrl = $PublicServerUrl
  publicClientUrl = $PublicClientUrl
  localClientUrl = $localClientUrl
  processes = $processes | ForEach-Object {
    [pscustomobject]@{
      name = $_.name
      pid = $_.pid
      outLog = $_.outLog
      errLog = $_.errLog
      publicUrl = $_.publicUrl
    }
  }
}
$session | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath $SessionFile -Encoding UTF8

Write-Host ""
Write-Host "Public multiplayer is running." -ForegroundColor Green
Write-Host "Game URL: $shareUrl" -ForegroundColor Yellow
Write-Host "Backend URL: $PublicServerUrl" -ForegroundColor Yellow
Write-Host "Local client: $localClientUrl"
Write-Host "Logs: $LogDir"
Write-Host ""
Write-Host "Stop command: powershell -ExecutionPolicy Bypass -File scripts\stop-public.ps1"

if (-not $NoOpen) {
  Start-Process $shareUrl
}
