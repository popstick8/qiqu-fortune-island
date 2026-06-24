@echo off
cd /d "%~dp0"
echo Sakura / custom mapping mode
echo.
echo You need two Sakura mappings:
echo   backend  -> local 127.0.0.1:4011
echo   frontend -> local 127.0.0.1:5174
echo.
set /p SERVER_URL=Backend public URL, for example https://xxxx.example.com :
set /p CLIENT_URL=Frontend public URL, optional :
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\start-public.ps1" -Mode custom -PublicServerUrl "%SERVER_URL%" -PublicClientUrl "%CLIENT_URL%"
pause
