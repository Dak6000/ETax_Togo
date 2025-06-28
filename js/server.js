const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

// Importer les modules d'authentification et de base de données
const auth = require('./auth');
const { db } = require('./database');

// Importer les routes d'administration
const adminRoutes = require('./admin-routes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:5500', 'http://localhost:5500'],
  credentials: true
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Servir les fichiers statiques (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, '..')));

// Routes d'authentification
app.post('/api/auth/register', auth.validateRegistration, auth.register);
app.post('/api/auth/login', auth.validateLogin, auth.login);
app.post('/api/auth/logout', auth.logout);
app.get('/api/auth/profile', auth.authenticateToken, auth.getProfile);

// Routes d'administration
app.use('/api/admin', adminRoutes);

// Route de test
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Serveur ETax Togo opérationnel',
    timestamp: new Date().toISOString()
  });
});

// Route pour le dashboard utilisateur
app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// Route pour le dashboard administrateur
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'admin', 'dashboard.html'));
});

// Gestion des erreurs 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route non trouvée'
  });
});

// Middleware de gestion d'erreurs global
app.use((error, req, res, next) => {
  console.error('Erreur serveur:', error);
  res.status(500).json({
    success: false,
    message: 'Erreur interne du serveur'
  });
});

// Démarrer le serveur
app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur le port ${PORT}`);
  console.log(`📱 Interface utilisateur: http://localhost:${PORT}`);
  console.log(`🔧 API: http://localhost:${PORT}/api`);
  console.log(`👨‍💼 Dashboard admin: http://localhost:${PORT}/admin`);
  console.log('Routes disponibles:');
  console.log('  - GET / - Redirection vers /login.html');
  console.log('  - GET /login - Page de connexion');
  console.log('  - GET /register - Page d\'inscription');
  console.log('  - GET /dashboard - Tableau de bord (après connexion)');
  console.log('  - GET /admin - Dashboard administrateur');
  console.log('  - POST /api/auth/register - Inscription');
  console.log('  - POST /api/auth/login - Connexion');
  console.log('  - POST /api/auth/logout - Déconnexion');
  console.log('  - GET /api/auth/profile - Profil utilisateur');
  console.log('  - GET /api/admin/* - Routes d\'administration');
  console.log('  - GET /api/health - État du serveur');
});

// Gestion propre de l'arrêt du serveur
process.on('SIGINT', () => {
  console.log('\nArrêt du serveur...');
  db.close((err) => {
    if (err) {
      console.error('Erreur lors de la fermeture de la base de données:', err.message);
    } else {
      console.log('Base de données fermée.');
    }
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('\nArrêt du serveur...');
  db.close((err) => {
    if (err) {
      console.error('Erreur lors de la fermeture de la base de données:', err.message);
    } else {
      console.log('Base de données fermée.');
    }
    process.exit(0);
  });
}); 