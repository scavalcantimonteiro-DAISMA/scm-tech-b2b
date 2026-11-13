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
echo  [>] Acesso neste computador:  http://localhost:3001
echo  [>] Acesso em outros PCs/Cel: http://192.168.1.188:3001
echo.

start http://localhost:3001
node server/index.js

pause
