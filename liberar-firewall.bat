@echo off
title Liberar Porta 3001 no Firewall do Windows
cls
echo ========================================================
echo     SCM TECH - LIBERACAO DE ACESSO EM OUTROS PCS
echo ========================================================
echo.
echo Adicionando regra no Firewall do Windows para a porta 3001...
echo.
netsh advfirewall firewall delete rule name="SCM TECH B2B - Porta 3001" >nul 2>&1
netsh advfirewall firewall add rule name="SCM TECH B2B - Porta 3001" dir=in action=allow protocol=TCP localport=3001
echo.
if %errorlevel% equ 0 (
    echo [SUCESSO] Porta 3001 liberada com sucesso!
    echo Agora qualquer computador ou celular no mesmo Wi-Fi conseguira acessar:
    echo http://192.168.1.188:3001
) else (
    echo [ERRO] Nao foi possivel adicionar a regra.
    echo Por favor, clique com o BOTAO DIREITO neste arquivo e selecione:
    echo "Executar como Administrador"
)
echo.
pause
