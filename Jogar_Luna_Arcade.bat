@echo off
title Servidor - Salsichinha Luna Arcade
color 0A

echo ========================================================
echo          INICIANDO O SALSICHINHA LUNA ARCADE
echo ========================================================
echo.
echo Abrindo o servidor local...
echo O seu navegador carregara o jogo automaticamente!
echo.
echo Quando quiser parar de jogar, basta fechar esta janela preta.
echo.

:: Abre o navegador padrão diretamente na porta 8080
start "" "http://localhost:8080"

:: Inicia o servidor Python
python -m http.server 8080
