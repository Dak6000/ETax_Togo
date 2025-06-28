# Backend ETax Togo - Authentification

Ce dossier contient le backend JavaScript pour l'application ETax Togo avec système d'authentification complet utilisant SQLite.

## Structure des fichiers

```
js/
├── package.json          # Dépendances Node.js
├── server.js            # Serveur Express principal
├── database.js          # Configuration et gestion de la base de données SQLite
├── auth.js              # Logique d'authentification (inscription, connexion, etc.)
├── client.js            # Code JavaScript côté client pour l'interface
└── README.md            # Ce fichier
```

## Installation

1. **Installer Node.js** (version 14 ou supérieure)

2. **Installer les dépendances** :
   ```bash
   cd js
   npm install
   ```

## Démarrage du serveur

### Mode développement (avec rechargement automatique)
```bash
npm run dev
```

### Mode production
```bash
npm start
```

Le serveur démarre sur `http://localhost:3000`

## API Endpoints

### Authentification

- **POST** `/api/auth/register` - Inscription d'un nouvel utilisateur
- **POST** `/api/auth/login` - Connexion utilisateur
- **POST** `/api/auth/logout` - Déconnexion utilisateur
- **GET** `/api/auth/profile` - Récupération du profil utilisateur (protégé)

### Autres

- **GET** `/api/health` - État du serveur
- **GET** `/` - Page d'accueil
- **GET** `/login` - Page de connexion
- **GET** `/register` - Page d'inscription

## Base de données

La base de données SQLite (`etax_togo.db`) est créée automatiquement avec les tables suivantes :

### Table `users`
- `id` (INTEGER, PRIMARY KEY)
- `nom` (TEXT, NOT NULL)
- `prenom` (TEXT, NOT NULL)
- `email` (TEXT, UNIQUE, NOT NULL)
- `phone` (TEXT, NOT NULL)
- `password` (TEXT, NOT NULL) - Hashé avec bcrypt
- `adresse` (TEXT)
- `numero_fiscale` (TEXT, UNIQUE, NOT NULL)
- `secteur` (TEXT, NOT NULL)
- `created_at` (DATETIME)
- `updated_at` (DATETIME)

### Table `sessions`
- `id` (INTEGER, PRIMARY KEY)
- `user_id` (INTEGER, FOREIGN KEY)
- `token` (TEXT, UNIQUE, NOT NULL)
- `expires_at` (DATETIME, NOT NULL)
- `created_at` (DATETIME)

### Table `taxes`
- `id` (INTEGER, PRIMARY KEY)
- `user_id` (INTEGER, FOREIGN KEY)
- `montant` (REAL, NOT NULL)
- `type_taxe` (TEXT, NOT NULL)
- `statut` (TEXT, DEFAULT 'en_attente')
- `date_paiement` (DATETIME)
- `created_at` (DATETIME)

## Sécurité

- **Mots de passe** : Hashés avec bcrypt (12 rounds de sel)
- **Tokens JWT** : Expiration après 24h
- **Validation** : Express-validator pour valider les données
- **CORS** : Configuré pour les origines autorisées
- **Sessions** : Stockées en base de données avec expiration

## Utilisation côté client

Le fichier `client.js` fournit une classe `AuthClient` pour gérer l'authentification côté client :

```javascript
// Inscription
const result = await authClient.register(userData);

// Connexion
const result = await authClient.login(email, password);

// Déconnexion
await authClient.logout();

// Vérifier si connecté
if (authClient.isAuthenticated()) {
  // Utilisateur connecté
}
```

## Variables d'environnement

Pour la production, il est recommandé de définir :

- `PORT` : Port du serveur (défaut: 3000)
- `JWT_SECRET` : Clé secrète pour les tokens JWT

## Dépendances principales

- **Express** : Framework web
- **SQLite3** : Base de données
- **bcryptjs** : Hachage des mots de passe
- **jsonwebtoken** : Gestion des tokens JWT
- **express-validator** : Validation des données
- **cors** : Gestion des requêtes cross-origin
- **body-parser** : Parsing des requêtes

## Développement

Pour le développement, le serveur redémarre automatiquement grâce à `nodemon` quand les fichiers sont modifiés.

## Production

Pour la production, assurez-vous de :

1. Changer la clé JWT_SECRET
2. Configurer les variables d'environnement
3. Utiliser HTTPS
4. Configurer un reverse proxy (nginx, Apache)
5. Utiliser un gestionnaire de processus (PM2) 