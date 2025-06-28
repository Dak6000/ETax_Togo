@echo off
echo ========================================
echo    E-Taxe TOGO - Plateforme de Gestion Fiscale
echo ========================================
echo.

REM Vérifier si Node.js est installé
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Erreur: Node.js n'est pas installé ou n'est pas dans le PATH
    echo 📥 Veuillez installer Node.js depuis https://nodejs.org/
    pause
    exit /b 1
)

echo ✅ Node.js détecté
echo.

REM Vérifier si le port 3000 est utilisé
echo 🔍 Vérification du port 3000...
netstat -ano | findstr :3000 >nul 2>&1
if %errorlevel% equ 0 (
    echo ⚠️  Le port 3000 est déjà utilisé
    echo 🔄 Tentative d'arrêt des processus existants...
    
    REM Trouver et arrêter les processus sur le port 3000
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000') do (
        echo 🛑 Arrêt du processus PID: %%a
        taskkill /PID %%a /F >nul 2>&1
    )
    
    echo ⏳ Attente de 3 secondes...
    timeout /t 3 /nobreak >nul
    echo.
)

REM Vérifier si les dépendances sont installées
if not exist "node_modules" (
    echo 📦 Installation des dépendances...
    npm install
    if %errorlevel% neq 0 (
        echo ❌ Erreur lors de l'installation des dépendances
        pause
        exit /b 1
    )
    echo ✅ Dépendances installées
) else (
    echo ✅ Dépendances déjà installées
)

echo.
echo 🌱 Initialisation de la base de données...
echo 📊 Peuplement automatique avec des données de test...
echo.

REM Démarrer le serveur
echo 🎯 Démarrage du serveur sur http://localhost:3000
echo 👨‍💼 Dashboard admin: http://localhost:3000/admin
echo.
echo 📋 Comptes de test disponibles:
echo    - Admin: admin@etaxe.tg / admin123
echo    - User: kossi.mensah@example.com / password123
echo.
echo ⚠️  Appuyez sur Ctrl+C pour arrêter le serveur
echo ========================================
echo.

REM Démarrer le serveur avec gestion d'erreur
npm start
if %errorlevel% neq 0 (
    echo.
    echo ❌ Erreur lors du démarrage du serveur
    echo 💡 Vérifiez que le port 3000 n'est pas utilisé par une autre application
    echo.
    pause
    exit /b 1
)

pause 