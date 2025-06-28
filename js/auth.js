const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { runQuery, getQuery, allQuery } = require('./database');

// Clé secrète pour JWT (en production, utiliser une variable d'environnement)
const JWT_SECRET = 'etax_togo_secret_key_2024';

// Middleware de validation pour l'inscription
const validateRegistration = [
  body('nom').trim().isLength({ min: 2 }).withMessage('Le nom doit contenir au moins 2 caractères'),
  body('prenom').trim().isLength({ min: 2 }).withMessage('Le prénom doit contenir au moins 2 caractères'),
  body('email').isEmail().normalizeEmail().withMessage('Email invalide'),
  body('phone').matches(/^(\+228|228)?[0-9]{8}$/).withMessage('Numéro de téléphone togolais invalide'),
  body('password').isLength({ min: 6 }).withMessage('Le mot de passe doit contenir au moins 6 caractères'),
  body('numero_fiscale').isLength({ min: 5 }).withMessage('Le numéro fiscal doit contenir au moins 5 caractères'),
  body('secteur').notEmpty().withMessage('Le secteur d\'activité est requis')
];

// Middleware de validation pour la connexion
const validateLogin = [
  body('email').isEmail().normalizeEmail().withMessage('Email invalide'),
  body('password').notEmpty().withMessage('Le mot de passe est requis')
];

// Fonction d'inscription
async function register(req, res) {
  try {
    // Vérifier les erreurs de validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: errors.array()
      });
    }

    const { nom, prenom, email, phone, password, adresse, numero_fiscale, secteur } = req.body;

    // Vérifier si l'email existe déjà
    const existingUser = await getQuery('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Un utilisateur avec cet email existe déjà'
      });
    }

    // Vérifier si le numéro fiscal existe déjà
    const existingFiscal = await getQuery('SELECT id FROM users WHERE numero_fiscale = ?', [numero_fiscale]);
    if (existingFiscal) {
      return res.status(400).json({
        success: false,
        message: 'Un utilisateur avec ce numéro fiscal existe déjà'
      });
    }

    // Hasher le mot de passe
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insérer l'utilisateur dans la base de données (rôle par défaut: 'user')
    const result = await runQuery(
      'INSERT INTO users (nom, prenom, email, phone, password, adresse, numero_fiscale, secteur, role) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [nom, prenom, email, phone, hashedPassword, adresse, numero_fiscale, secteur, 'user']
    );

    // Récupérer les informations de l'utilisateur créé (sans le mot de passe)
    const newUser = await getQuery(
      'SELECT id, nom, prenom, email, phone, adresse, numero_fiscale, secteur, role, created_at FROM users WHERE id = ?',
      [result.id]
    );

    // Générer un token JWT
    const token = jwt.sign(
      { 
        userId: newUser.id, 
        email: newUser.email,
        numeroFiscale: newUser.numero_fiscale,
        role: newUser.role
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Sauvegarder la session
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 heures
    await runQuery(
      'INSERT INTO sessions (user_id, token, expires_at) VALUES (?, ?, ?)',
      [newUser.id, token, expiresAt.toISOString()]
    );

    res.status(201).json({
      success: true,
      message: 'Inscription réussie',
      data: {
        user: newUser,
        token: token,
        redirectTo: newUser.role === 'admin' ? '/admin' : '/dashboard'
      }
    });

  } catch (error) {
    console.error('Erreur lors de l\'inscription:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
}

// Fonction de connexion
async function login(req, res) {
  try {
    // Vérifier les erreurs de validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    // Rechercher l'utilisateur par email
    const user = await getQuery(
      'SELECT id, nom, prenom, email, phone, password, adresse, numero_fiscale, secteur, role, created_at FROM users WHERE email = ?',
      [email]
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect'
      });
    }

    // Vérifier le mot de passe
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect'
      });
    }

    // Supprimer le mot de passe de la réponse
    const { password: _, ...userWithoutPassword } = user;

    // Générer un token JWT
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email,
        numeroFiscale: user.numero_fiscale,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Supprimer les anciennes sessions de l'utilisateur
    await runQuery('DELETE FROM sessions WHERE user_id = ?', [user.id]);

    // Sauvegarder la nouvelle session
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 heures
    await runQuery(
      'INSERT INTO sessions (user_id, token, expires_at) VALUES (?, ?, ?)',
      [user.id, token, expiresAt.toISOString()]
    );

    res.json({
      success: true,
      message: 'Connexion réussie',
      data: {
        user: userWithoutPassword,
        token: token,
        redirectTo: user.role === 'admin' ? '/admin' : '/dashboard'
      }
    });

  } catch (error) {
    console.error('Erreur lors de la connexion:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
}

// Fonction de déconnexion
async function logout(req, res) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (token) {
      // Supprimer la session
      await runQuery('DELETE FROM sessions WHERE token = ?', [token]);
    }

    res.json({
      success: true,
      message: 'Déconnexion réussie'
    });

  } catch (error) {
    console.error('Erreur lors de la déconnexion:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
}

// Middleware d'authentification
async function authenticateToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token d\'authentification manquant'
      });
    }

    // Vérifier si le token existe dans la base de données
    const session = await getQuery(
      'SELECT user_id, expires_at FROM sessions WHERE token = ?',
      [token]
    );

    if (!session) {
      return res.status(401).json({
        success: false,
        message: 'Token invalide'
      });
    }

    // Vérifier si le token a expiré
    if (new Date(session.expires_at) < new Date()) {
      // Supprimer la session expirée
      await runQuery('DELETE FROM sessions WHERE token = ?', [token]);
      return res.status(401).json({
        success: false,
        message: 'Token expiré'
      });
    }

    // Vérifier le token JWT
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Récupérer les informations de l'utilisateur
    const user = await getQuery(
      'SELECT id, nom, prenom, email, phone, adresse, numero_fiscale, secteur, role, created_at FROM users WHERE id = ?',
      [decoded.userId]
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    req.user = user;
    next();

  } catch (error) {
    console.error('Erreur d\'authentification:', error);
    return res.status(401).json({
      success: false,
      message: 'Token invalide'
    });
  }
}

// Middleware pour vérifier les droits d'administrateur
async function requireAdmin(req, res, next) {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé. Droits d\'administrateur requis.'
      });
    }
    next();
  } catch (error) {
    res.status(403).json({
      success: false,
      message: 'Accès refusé. Droits d\'administrateur requis.'
    });
  }
}

// Fonction pour obtenir le profil utilisateur
async function getProfile(req, res) {
  try {
    res.json({
      success: true,
      data: {
        user: req.user
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération du profil:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
}

// Fonction pour mettre à jour le profil utilisateur
async function updateProfile(req, res) {
  try {
    const userId = req.user.id;
    const {
      nom,
      prenom,
      email,
      phone,
      adresse,
      numero_fiscale,
      secteur,
      currentPassword,
      newPassword
    } = req.body;

    // Validation des champs obligatoires
    if (!nom || !prenom || !email || !phone || !numero_fiscale || !secteur) {
      return res.status(400).json({
        success: false,
        message: 'Tous les champs obligatoires doivent être remplis'
      });
    }

    // Vérifier si l'email existe déjà pour un autre utilisateur
    const existingUser = await getQuery(
      'SELECT id FROM users WHERE email = ? AND id != ?',
      [email, userId]
    );

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Cet email est déjà utilisé par un autre utilisateur'
      });
    }

    // Vérifier si le numéro fiscal existe déjà pour un autre utilisateur
    const existingFiscal = await getQuery(
      'SELECT id FROM users WHERE numero_fiscale = ? AND id != ?',
      [numero_fiscale, userId]
    );

    if (existingFiscal) {
      return res.status(400).json({
        success: false,
        message: 'Ce numéro fiscal est déjà utilisé par un autre utilisateur'
      });
    }

    // Si un changement de mot de passe est demandé
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({
          success: false,
          message: 'Le mot de passe actuel est requis pour changer le mot de passe'
        });
      }

      // Vérifier le mot de passe actuel
      const currentUser = await getQuery(
        'SELECT password FROM users WHERE id = ?',
        [userId]
      );

      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, currentUser.password);
      if (!isCurrentPasswordValid) {
        return res.status(400).json({
          success: false,
          message: 'Le mot de passe actuel est incorrect'
        });
      }

      // Valider le nouveau mot de passe
      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Le nouveau mot de passe doit contenir au moins 6 caractères'
        });
      }

      // Hasher le nouveau mot de passe
      const hashedNewPassword = await bcrypt.hash(newPassword, 10);

      // Mettre à jour avec le nouveau mot de passe
      await runQuery(
        `UPDATE users SET 
          nom = ?, prenom = ?, email = ?, phone = ?, adresse = ?, 
          numero_fiscale = ?, secteur = ?, password = ?
        WHERE id = ?`,
        [nom, prenom, email, phone, adresse, numero_fiscale, secteur, hashedNewPassword, userId]
      );
    } else {
      // Mettre à jour sans changer le mot de passe
      await runQuery(
        `UPDATE users SET 
          nom = ?, prenom = ?, email = ?, phone = ?, adresse = ?, 
          numero_fiscale = ?, secteur = ?
        WHERE id = ?`,
        [nom, prenom, email, phone, adresse, numero_fiscale, secteur, userId]
      );
    }

    // Récupérer l'utilisateur mis à jour
    const updatedUser = await getQuery(
      'SELECT id, nom, prenom, email, phone, adresse, numero_fiscale, secteur, role, created_at FROM users WHERE id = ?',
      [userId]
    );

    res.json({
      success: true,
      message: 'Profil mis à jour avec succès',
      data: {
        user: updatedUser
      }
    });

  } catch (error) {
    console.error('Erreur lors de la mise à jour du profil:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
}

module.exports = {
  validateRegistration,
  validateLogin,
  register,
  login,
  logout,
  authenticateToken,
  requireAdmin,
  getProfile,
  updateProfile
}; 