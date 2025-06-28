@echo off
echo ========================================
echo Installation du backend ETax Togo
echo ========================================
echo.

echo Vérification de Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERREUR: Node.js n'est pas installé.
    echo Veuillez installer Node.js depuis https://nodejs.org/
    pause
    exit /b 1
)

echo Node.js détecté.
echo.

echo Installation des dépendances...
npm install

if %errorlevel% neq 0 (
    echo ERREUR: Échec de l'installation des dépendances.
    pause
    exit /b 1
)

echo.
echo ========================================
echo Installation terminée avec succès !
echo ========================================
echo.
echo Pour démarrer le serveur :
echo   npm run dev    (mode développement)
echo   npm start      (mode production)
echo.
echo Le serveur sera accessible sur : http://localhost:3000
echo.
pause 