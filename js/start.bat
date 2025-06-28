@echo off
echo ========================================
echo    E-Taxe TOGO - Plateforme de Gestion Fiscale
echo ========================================
echo.
echo 🚀 Démarrage du serveur...
echo.

REM Vérifier si Node.js est installé
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Erreur: Node.js n'est pas installé ou n'est pas dans le PATH
    echo 📥 Veuillez installer Node.js depuis https://nodejs.org/
    pause
    exit /b 1
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
)

echo ✅ Dépendances vérifiées
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

npm start

pause 