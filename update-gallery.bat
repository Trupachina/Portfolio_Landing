@echo off
chcp 65001 > nul
cd /d "%~dp0"
python tools\build-media-manifest.py
if errorlevel 1 (
  echo.
  echo Не удалось запустить Python. Установите Python 3 или выполните:
  echo py tools\build-media-manifest.py
  pause
  exit /b 1
)
echo.
echo Готово. Теперь можно открыть index.html или загрузить изменения на GitHub.
pause
