@echo off
title Bre - Baslatici
color 0A

echo.
echo  ================================
echo   BRE - Berber Randevu Platformu
echo  ================================
echo.

:: Node.js PATH'ini yenile
for /f "tokens=*" %%i in ('powershell -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\"Path\",\"Machine\")"') do set SYS_PATH=%%i
for /f "tokens=*" %%i in ('powershell -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\"Path\",\"User\")"') do set USR_PATH=%%i
set PATH=%SYS_PATH%;%USR_PATH%

echo  Sunucu yeni pencerede aciliyor...

:: Sunucuyu AYRI bir pencerede başlat (o pencereyi kapatınca sunucu durur)
start "Bre - Sunucu (kapatinca durur)" cmd /k "npm run dev"

echo  Tarayici 8 saniye sonra acilacak...
echo.

:: Sunucunun hazır olması için bekle
timeout /t 8 /nobreak >nul

:: Varsayılan tarayıcıda aç
start http://localhost:3000

echo  Tarayici acildi! Bu pencere kapanabilir.
timeout /t 2 /nobreak >nul
