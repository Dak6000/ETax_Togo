// Configuration de l'API
const API_BASE_URL = 'http://localhost:3000/api';

// Classe pour gérer l'authentification côté client
class AuthClient {
  constructor() {
    this.token = localStorage.getItem('authToken');
    this.user = JSON.parse(localStorage.getItem('user'));
  }

  // Sauvegarder les données d'authentification
  saveAuthData(token, user) {
    this.token = token;
    this.user = user;
    localStorage.setItem('authToken', token);
    localStorage.setItem('user', JSON.stringify(user));
  }

  // Supprimer les données d'authentification
  clearAuthData() {
    this.token = null;
    this.user = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  }

  // Vérifier si l'utilisateur est connecté
  isAuthenticated() {
    return !!this.token;
  }

  // Vérifier si l'utilisateur est administrateur
  isAdmin() {
    return this.user && this.user.role === 'admin';
  }

  // Obtenir les headers d'authentification
  getAuthHeaders() {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.token}`
    };
  }

  // Fonction d'inscription
  async register(userData) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      });

      const data = await response.json();

      if (data.success) {
        this.saveAuthData(data.data.token, data.data.user);
        return { success: true, data: data.data };
      } else {
        return { success: false, message: data.message, errors: data.errors };
      }
    } catch (error) {
      console.error('Erreur lors de l\'inscription:', error);
      return { success: false, message: 'Erreur de connexion au serveur' };
    }
  }

  // Fonction de connexion
  async login(email, password) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (data.success) {
        this.saveAuthData(data.data.token, data.data.user);
        return { success: true, data: data.data };
      } else {
        return { success: false, message: data.message };
      }
    } catch (error) {
      console.error('Erreur lors de la connexion:', error);
      return { success: false, message: 'Erreur de connexion au serveur' };
    }
  }

  // Fonction de déconnexion
  async logout() {
    try {
      if (this.token) {
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: this.getAuthHeaders()
        });
      }
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    } finally {
      this.clearAuthData();
    }
  }

  // Obtenir le profil utilisateur
  async getProfile() {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/profile`, {
        headers: this.getAuthHeaders()
      });

      const data = await response.json();

      if (data.success) {
        this.user = data.data.user;
        localStorage.setItem('user', JSON.stringify(this.user));
        return { success: true, data: data.data };
      } else {
        return { success: false, message: data.message };
      }
    } catch (error) {
      console.error('Erreur lors de la récupération du profil:', error);
      return { success: false, message: 'Erreur de connexion au serveur' };
    }
  }
}

// Instance globale de l'authentification
const authClient = new AuthClient();

// Fonctions utilitaires pour l'interface utilisateur
function showMessage(message, type = 'info') {
  // Créer un élément de message
  const messageDiv = document.createElement('div');
  messageDiv.className = `message message-${type}`;
  messageDiv.textContent = message;
  
  // Styles pour les messages
  messageDiv.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 15px 20px;
    border-radius: 5px;
    color: white;
    font-weight: 500;
    z-index: 1000;
    max-width: 300px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  `;

  // Couleurs selon le type
  switch (type) {
    case 'success':
      messageDiv.style.backgroundColor = '#10b981';
      break;
    case 'error':
      messageDiv.style.backgroundColor = '#ef4444';
      break;
    case 'warning':
      messageDiv.style.backgroundColor = '#f59e0b';
      break;
    default:
      messageDiv.style.backgroundColor = '#3b82f6';
  }

  // Ajouter au DOM
  document.body.appendChild(messageDiv);

  // Supprimer après 5 secondes
  setTimeout(() => {
    if (messageDiv.parentNode) {
      messageDiv.parentNode.removeChild(messageDiv);
    }
  }, 5000);
}

function showLoading(element) {
  const originalText = element.textContent;
  element.textContent = 'Chargement...';
  element.disabled = true;
  return () => {
    element.textContent = originalText;
    element.disabled = false;
  };
}

function redirectTo(url) {
  window.location.href = url;
}

// Gestionnaire pour le formulaire d'inscription
function handleRegistration() {
  const form = document.getElementById('signupForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const submitBtn = form.querySelector('button[type="submit"]');
    const stopLoading = showLoading(submitBtn);

    try {
      // Récupérer les données du formulaire
      const formData = new FormData(form);
      const userData = {
        nom: formData.get('nom'),
        prenom: formData.get('prenom'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        password: formData.get('password'),
        confirm_password: formData.get('confirm_password'),
        adresse: formData.get('adresse'),
        numero_fiscale: formData.get('numero_fiscale'),
        secteur: formData.get('secteur')
      };

      // Validation côté client
      if (userData.password !== userData.confirm_password) {
        showMessage('Les mots de passe ne correspondent pas', 'error');
        stopLoading();
        return;
      }

      // Supprimer confirm_password avant l'envoi
      delete userData.confirm_password;

      // Envoyer la requête d'inscription
      const result = await authClient.register(userData);

      if (result.success) {
        showMessage('Inscription réussie ! Redirection...', 'success');
        setTimeout(() => {
          // Rediriger selon le rôle
          const redirectUrl = result.data.redirectTo || '/dashboard';
          redirectTo(redirectUrl);
        }, 2000);
      } else {
        if (result.errors) {
          // Afficher les erreurs de validation
          result.errors.forEach(error => {
            showMessage(error.msg, 'error');
          });
        } else {
          showMessage(result.message, 'error');
        }
      }
    } catch (error) {
      console.error('Erreur lors de l\'inscription:', error);
      showMessage('Une erreur est survenue', 'error');
    } finally {
      stopLoading();
    }
  });
}

// Gestionnaire pour le formulaire de connexion
function handleLogin() {
  const form = document.querySelector('form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const submitBtn = form.querySelector('button[type="submit"]');
    const stopLoading = showLoading(submitBtn);

    try {
      const formData = new FormData(form);
      const email = formData.get('email');
      const password = formData.get('password');

      const result = await authClient.login(email, password);

      if (result.success) {
        showMessage('Connexion réussie ! Redirection...', 'success');
        setTimeout(() => {
          // Rediriger selon le rôle
          const redirectUrl = result.data.redirectTo || '/dashboard';
          redirectTo(redirectUrl);
        }, 2000);
      } else {
        showMessage(result.message, 'error');
      }
    } catch (error) {
      console.error('Erreur lors de la connexion:', error);
      showMessage('Une erreur est survenue', 'error');
    } finally {
      stopLoading();
    }
  });
}

// Gestionnaire pour la déconnexion
function handleLogout() {
  const logoutBtn = document.querySelector('.logout-btn');
  if (!logoutBtn) return;

  logoutBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    
    await authClient.logout();
    showMessage('Déconnexion réussie', 'success');
    setTimeout(() => {
      redirectTo('/login.html');
    }, 1500);
  });
}

// Vérifier l'authentification sur les pages protégées
function checkAuth() {
  if (!authClient.isAuthenticated()) {
    redirectTo('/login.html');
    return false;
  }
  return true;
}

// Vérifier les droits d'administrateur
function checkAdmin() {
  if (!authClient.isAuthenticated()) {
    redirectTo('/login.html');
    return false;
  }
  if (!authClient.isAdmin()) {
    showMessage('Accès refusé. Droits d\'administrateur requis.', 'error');
    redirectTo('/dashboard');
    return false;
  }
  return true;
}

// Initialiser les gestionnaires selon la page
document.addEventListener('DOMContentLoaded', () => {
  const currentPage = window.location.pathname;

  if (currentPage.includes('register.html')) {
    handleRegistration();
  } else if (currentPage.includes('login.html')) {
    handleLogin();
  } else if (currentPage.includes('dashboard') || currentPage === '/') {
    if (!checkAuth()) return;
    handleLogout();
  } else if (currentPage.includes('admin')) {
    if (!checkAdmin()) return;
    // Le dashboard admin est géré par dashboard.js
  }
});

// Exporter pour utilisation globale
window.AuthClient = AuthClient;
window.authClient = authClient;
window.showMessage = showMessage;
window.redirectTo = redirectTo; 