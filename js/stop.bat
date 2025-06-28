@echo off
echo ========================================
echo    Arrêt du serveur E-Taxe TOGO
echo ========================================
echo.

echo 🔍 Recherche des processus Node.js sur le port 3000...

REM Trouver les processus sur le port 3000
netstat -ano | findstr :3000 >nul 2>&1
if %errorlevel% equ 0 (
    echo ⚠️  Processus trouvé sur le port 3000
    echo 🛑 Arrêt en cours...
    
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000') do (
        echo 🛑 Arrêt du processus PID: %%a
        taskkill /PID %%a /F >nul 2>&1
        if !errorlevel! equ 0 (
            echo ✅ Processus arrêté avec succès
        ) else (
            echo ❌ Erreur lors de l'arrêt du processus
        )
    )
    
    echo.
    echo ✅ Serveur arrêté
) else (
    echo ℹ️  Aucun processus trouvé sur le port 3000
    echo ✅ Le serveur n'était pas en cours d'exécution
)

echo.
echo ========================================
pause 