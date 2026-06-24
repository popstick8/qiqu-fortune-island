@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo.
echo === 启动本地奇趣财富岛 ===
echo.
echo 本地游戏地址: http://localhost:5173
echo 后端地址:     http://localhost:4000
echo.
echo 如果第一次启动失败，请先运行 npm install。
echo 关闭这个窗口会停止本地服务。
echo.
npm run dev
echo.
echo 服务已停止。按任意键关闭窗口。
pause >nul
