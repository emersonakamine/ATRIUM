@echo off
chcp 65001 >nul
title BP Eventos - Startup
echo ============================================
echo   BP Eventos - Iniciando sistemas...
echo ============================================

REM 1. Docker (Evolution API + Redis + Postgres)
echo [1/3] Subindo Evolution API (Docker)...
cd /d "C:\Projetos G\CTRLEventos"
docker compose -f docker-compose.evolution.yml up -d
echo      OK

REM 2. Backend (server.ts)
echo [2/3] Subindo backend...
timeout /t 5 /nobreak >nul
start "BP-Backend" /min cmd /c "cd /d C:\Projetos G\CTRLEventos && npx tsx server.ts"
echo      OK

REM 3. Tunnel + notificacao WhatsApp
echo [3/3] Subindo tunnel + WhatsApp...
timeout /t 10 /nobreak >nul
start "BP-Tunnel" /min powershell -ExecutionPolicy Bypass -File "C:\Projetos G\CTRLEventos\start-tunnel.ps1"
echo      OK

echo ============================================
echo   Tudo iniciado! Aguarde ~30 segundos.
echo   Tunnel: veja a URL na janela "BP-Tunnel"
echo ============================================
timeout /t 10 >nul
