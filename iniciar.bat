@echo off
title SCM TECH - Prospeccao B2B & Agendamento de Visitas
cls
echo ========================================================
echo        SISTEMA DE PROSPECCAO CORPORATIVA B2B
echo            Desenvolvido pela SCM TECH
echo   Hoteis, Pousadas, Hospitais e Bares de Grande Porte
echo ========================================================
echo.
echo  [+] Login de Administrador: Adm
echo  [+] Senha de Administrador: S@ulo160605
echo.
echo  ========================================================
echo  COMO ACESSAR:
echo  1. Neste computador:
echo     http://localhost:3001
echo.
echo  2. Em OUTROS computadores ou celulares (no mesmo Wi-Fi):
echo     http://192.168.1.188:3001
echo     (Atencao: NAO digite localhost no outro dispositivo)
echo.
echo  * Se o outro computador nao conseguir carregar a pagina,
echo    execute uma unica vez o arquivo "liberar-firewall.bat"
echo    como Administrador neste computador.
echo  ========================================================
echo.

start http://localhost:3001
node server/index.js

pause
