@echo off
rem ===============================================================
rem arrancar.bat - Arranca la plataforma y el panel con doble clic
rem ---------------------------------------------------------------
rem Abre dos ventanas (plataforma en el puerto 8099 y panel de
rem administracion en el 8100) y luego el navegador. Para apagar,
rem cierra las ventanas o pulsa Ctrl+C dentro de cada una.
rem ===============================================================
cd /d "%~dp0"
start "Plataforma - puerto 8099" cmd /k npm run dev
start "Panel admin - puerto 8100" cmd /k npm run admin
timeout /t 2 /nobreak >nul
start http://localhost:8099
start http://localhost:8100
