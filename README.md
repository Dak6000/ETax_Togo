# E-Taxe TOGO - Plateforme de Gestion Fiscale

Une plateforme moderne de gestion fiscale pour le Togo, permettant aux contribuables de consulter et payer leurs taxes en ligne, et aux administrateurs de gérer l'ensemble du système.

## 🚀 Fonctionnalités

### Pour les Contribuables
- ✅ Inscription et connexion sécurisées
- ✅ Consultation du profil et des informations fiscales
- ✅ Visualisation de l'historique des paiements
- ✅ Interface responsive et moderne

### Pour les Administrateurs
- ✅ Dashboard administratif complet
- ✅ Gestion des utilisateurs et des taxes
- ✅ Statistiques en temps réel
- ✅ Suivi des taxes impayées
- ✅ Export de données
- ✅ Envoi de rappels automatiques

## 🛠️ Installation

### Prérequis
- Node.js (version 14 ou supérieure)
- npm ou yarn

### Étapes d'installation

1. **Cloner le projet**
   ```bash
   git clone <url-du-repo>
   cd ETax_Togo
   ```

2. **Installer les dépendances**
   ```bash
   cd js
   npm install
   ```

3. **Démarrer le serveur**
   ```bash
   npm start
   ```

4. **Accéder à l'application**
   - Interface utilisateur: http://localhost:3000
   - Dashboard admin: http://localhost:3000/admin

## 👨‍💼 Compte Administrateur par Défaut

Un compte administrateur est automatiquement créé lors du premier démarrage :

- **Email**: `admin@etaxe.tg`
- **Mot de passe**: `admin123`

⚠️ **IMPORTANT**: Changez ce mot de passe après la première connexion !

## 📊 Données de Test

Le système inclut des données de test pour démontrer les fonctionnalités :

### Utilisateurs de Test
- Kossi Mensah (kossi.mensah@example.com)
- Afi Doe (afi.doe@example.com)
- Kodjo Johnson (kodjo.johnson@example.com)
- Mawuena Smith (mawuena.smith@example.com)
- Kossivi Brown (kossivi.brown@example.com)

**Mot de passe pour tous les utilisateurs de test**: `password123`

### Taxes de Test
- Taxes payées et impayées
- Différents types de taxes (revenus, foncière, professionnelle, circulation)
- Montants variés pour les tests

## 🔐 Sécurité

- **Authentification JWT** avec expiration automatique
- **Hachage des mots de passe** avec bcrypt
- **Validation des données** côté serveur et client
- **Gestion des sessions** sécurisée
- **Contrôle d'accès** basé sur les rôles

## 🏗️ Architecture

```
ETax_Togo/
├── admin/                 # Interface d'administration
│   ├── dashboard.html    # Dashboard principal
│   └── dashboard.js      # Logique du dashboard
├── js/                   # Backend et logique métier
│   ├── server.js         # Serveur Express
│   ├── database.js       # Configuration SQLite
│   ├── auth.js           # Authentification
│   ├── admin.js          # Services d'administration
│   ├── admin-routes.js   # Routes d'administration
│   ├── client.js         # Client JavaScript
│   └── seed-data.js      # Données de test
├── index.html            # Page d'accueil utilisateur
├── login.html            # Page de connexion
├── register.html         # Page d'inscription
└── style.css             # Styles globaux
```

## 🔧 API Endpoints

### Authentification
- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion
- `POST /api/auth/logout` - Déconnexion
- `GET /api/auth/profile` - Profil utilisateur

### Administration (nécessite authentification admin)
- `GET /api/admin/stats` - Statistiques du dashboard
- `GET /api/admin/revenue-chart` - Données du graphique de recettes
- `GET /api/admin/recent-activity` - Activité récente
- `GET /api/admin/users` - Liste des utilisateurs
- `GET /api/admin/unpaid-taxes` - Taxes impayées
- `POST /api/admin/mark-tax-paid/:id` - Marquer une taxe comme payée
- `POST /api/admin/send-reminder/:id` - Envoyer un rappel
- `GET /api/admin/export/:type` - Exporter des données

## 🎨 Interface Utilisateur

### Technologies Frontend
- **Tailwind CSS** pour le design
- **Chart.js** pour les graphiques
- **JavaScript vanilla** pour l'interactivité

### Design Responsive
- Interface adaptée mobile et desktop
- Navigation intuitive
- Feedback visuel pour les actions

## 📈 Fonctionnalités du Dashboard Admin

### Statistiques en Temps Réel
- Nombre total d'utilisateurs
- Recettes totales
- Taxes impayées
- Taux de paiement

### Graphiques Interactifs
- Évolution des recettes (mensuel/annuel)
- Répartition par type de taxe
- Tendances de paiement

### Gestion des Taxes
- Liste des taxes impayées
- Actions rapides (marquer comme payé, envoyer rappel)
- Filtrage et recherche

### Export de Données
- Export CSV des utilisateurs
- Export CSV des taxes
- Rapports personnalisés

## 🚀 Déploiement

### Variables d'Environnement
```bash
PORT=3000                    # Port du serveur
JWT_SECRET=your_secret_key   # Clé secrète JWT
NODE_ENV=production          # Environnement
```

### Production
1. Configurer les variables d'environnement
2. Utiliser un process manager (PM2)
3. Configurer un reverse proxy (Nginx)
4. Sécuriser la base de données

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📝 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 📞 Support

Pour toute question ou problème :
- Ouvrir une issue sur GitHub
- Contacter l'équipe de développement

---

**E-Taxe TOGO** - Simplifiant la gestion fiscale au Togo 🇹🇬 