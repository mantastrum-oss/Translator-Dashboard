[CmdletBinding()]
param(
    [int]$ApiPort = 8000,
    [int]$WebPort = 5173
)

$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$ApiPath = Join-Path $Root 'apps\api'
$WebPath = Join-Path $Root 'apps\web'
$VenvPython = Join-Path $Root '.venv\Scripts\python.exe'

if (-not (Test-Path $ApiPath)) { throw "API directory not found: $ApiPath" }
if (-not (Test-Path $WebPath)) { throw "Web directory not found: $WebPath" }

if (Test-Path $VenvPython) {
    $PythonCommand = "& '$VenvPython' -m uvicorn app.main:app --reload --host 127.0.0.1 --port $ApiPort"
} else {
    $PythonCommand = "python -m uvicorn app.main:app --reload --host 127.0.0.1 --port $ApiPort"
}

Start-Process powershell.exe -ArgumentList @(
    '-NoExit',
    '-ExecutionPolicy', 'Bypass',
    '-Command', "Set-Location '$ApiPath'; $PythonCommand"
) -WorkingDirectory $ApiPath

Start-Process powershell.exe -ArgumentList @(
    '-NoExit',
    '-ExecutionPolicy', 'Bypass',
    '-Command', "Set-Location '$WebPath'; npm run dev -- --port $WebPort"
) -WorkingDirectory $WebPath

Write-Host "Analytics API: http://127.0.0.1:$ApiPort"
Write-Host "Dashboard:     http://localhost:$WebPort"
Write-Host 'Two service windows were opened. Close those windows to stop Analytics.'
