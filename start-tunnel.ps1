# BP Eventos - Tunnel + Notificacao WhatsApp
# Sobe o cloudflared e manda a URL no WhatsApp quando disponivel

$ErrorActionPreference = 'SilentlyContinue'

$EvolutionUrl = 'http://localhost:8081'
$EvolutionKey = 'evolution-bp-eventos-2026'
$Instance = 'bp-eventos'
$Phone = '5544999956011'
$Log = "$env:TEMP\cf-tunnel.log"

# Matar cloudflared antigo
Get-Process cloudflared -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2

# Limpar log
Remove-Item $Log -ErrorAction SilentlyContinue

# Iniciar tunnel
Start-Process -FilePath 'cloudflared' `
  -ArgumentList @('tunnel','--url','http://localhost:3002') `
  -RedirectStandardOutput $Log `
  -RedirectStandardError "$env:TEMP\cf-tunnel-err.log" `
  -WindowStyle Minimized

# Esperar URL
$url = ''
for ($i = 0; $i -lt 30; $i++) {
  Start-Sleep -Seconds 3
  $content = ''
  if (Test-Path $Log) { $content += Get-Content $Log -Raw }
  $errLog = "$env:TEMP\cf-tunnel-err.log"
  if (Test-Path $errLog) { $content += Get-Content $errLog -Raw }

  if ($content -match '(https://[a-z0-9\-]+\.trycloudflare\.com)') {
    $url = $Matches[1]
    break
  }
}

if (-not $url) {
  Write-Host 'ERRO: URL do tunnel nao encontrada'
  exit 1
}

Write-Host "Tunnel URL: $url"

# Enviar no WhatsApp via Evolution API
$msg = @{
  number = $Phone
  text = "BP Eventos - Nova URL do tunnel:`n$url`n`nAcesse e faca login com admin@eventiza.com.br"
} | ConvertTo-Json -Compress

$msgFile = "$env:TEMP\tunnel-msg.json"
$msg | Out-File -Encoding utf8 $msgFile

$headers = @{
  'Content-Type' = 'application/json'
  'apikey' = $EvolutionKey
}

try {
  $resp = Invoke-RestMethod -Uri "$EvolutionUrl/message/sendText/$Instance" `
    -Method Post -Headers $headers -Body ([System.Text.Encoding]::UTF8.GetBytes($msg)) -TimeoutSec 15
  Write-Host 'Mensagem enviada no WhatsApp!'
} catch {
  Write-Host "Erro ao enviar: $($_.Exception.Message)"
}
