$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
$ngrokExecutable = Join-Path $projectRoot '.tools\ngrok\ngrok.exe'
$trafficPolicy = Join-Path $projectRoot '.ngrok\sepay-policy.yml'
$ngrokConfig = Join-Path $projectRoot '.ngrok\ngrok.yml'
$envFile = Join-Path $projectRoot '.env'

if (-not (Test-Path -LiteralPath $ngrokExecutable -PathType Leaf)) {
    throw 'Missing project executable: .tools\ngrok\ngrok.exe'
}

if (Test-Path -LiteralPath $envFile -PathType Leaf) {
    $tokenLine = Get-Content -LiteralPath $envFile | Where-Object { $_ -match '^NGROK_AUTHTOKEN=' } | Select-Object -Last 1
    if ($tokenLine) {
        $token = ($tokenLine -split '=', 2)[1].Trim().Trim('"').Trim("'")
        if (-not [string]::IsNullOrWhiteSpace($token)) {
            $env:NGROK_AUTHTOKEN = $token
        }
    }
}

if ([string]::IsNullOrWhiteSpace($env:NGROK_AUTHTOKEN)) {
    throw 'NGROK_AUTHTOKEN is missing. Add it to the project .env file.'
}

$tomcatListener = Get-NetTCPConnection -LocalPort 8080 -State Listen -ErrorAction SilentlyContinue
if (-not $tomcatListener) {
    throw 'Tomcat is not listening on port 8080. Start the backend in NetBeans first.'
}

Write-Host 'Starting a restricted ngrok tunnel for the SePay webhook...'
Write-Host 'Local target: http://localhost:8080'
Write-Host 'Allowed path: POST /LucyBackendAPI/api/wallet/sepay-webhook'
Write-Host 'Inspector: http://127.0.0.1:4040'

& $ngrokExecutable http 8080 --config $ngrokConfig --traffic-policy-file $trafficPolicy
