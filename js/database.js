const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Chemin vers la base de données
const dbPath = path.join(__dirname, 'etax_togo.db');

// Créer une nouvelle instance de base de données
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Erreur lors de la connexion à la base de données:', err.message);
  } else {
    console.log('Connexion à la base de données SQLite établie.');
    initDatabase();
  }
});

// Initialiser la base de données avec les tables nécessaires
function initDatabase() {
  // Table des utilisateurs (ajout du champ role)
  const createUsersTable = `
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nom TEXT NOT NULL,
      prenom TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT NOT NULL,
      password TEXT NOT NULL,
      adresse TEXT,
      numero_fiscale TEXT UNIQUE NOT NULL,
      secteur TEXT NOT NULL,
      role TEXT DEFAULT 'user',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `;

  // Table des sessions (pour gérer les tokens)
  const createSessionsTable = `
    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      token TEXT UNIQUE NOT NULL,
      expires_at DATETIME NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )
  `;

  // Table des taxes (pour l'historique des paiements)
  const createTaxesTable = `
    CREATE TABLE IF NOT EXISTS taxes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      montant REAL NOT NULL,
      type_taxe TEXT NOT NULL,
      statut TEXT DEFAULT 'en_attente',
      date_paiement DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )
  `;

  // Table des rappels (pour les taxes impayées)
  const createRemindersTable = `
    CREATE TABLE IF NOT EXISTS reminders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tax_id INTEGER NOT NULL,
      sent_at DATETIME NOT NULL,
      status TEXT DEFAULT 'sent',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tax_id) REFERENCES taxes (id)
    )
  `;

  db.serialize(() => {
    db.run(createUsersTable, (err) => {
      if (err) {
        console.error('Erreur lors de la création de la table users:', err.message);
      } else {
        console.log('Table users créée ou déjà existante.');
        createDefaultAdmin();
      }
    });

    db.run(createSessionsTable, (err) => {
      if (err) {
        console.error('Erreur lors de la création de la table sessions:', err.message);
      } else {
        console.log('Table sessions créée ou déjà existante.');
      }
    });

    db.run(createTaxesTable, (err) => {
      if (err) {
        console.error('Erreur lors de la création de la table taxes:', err.message);
      } else {
        console.log('Table taxes créée ou déjà existante.');
      }
    });

    db.run(createRemindersTable, (err) => {
      if (err) {
        console.error('Erreur lors de la création de la table reminders:', err.message);
      } else {
        console.log('Table reminders créée ou déjà existante.');
        // Peupler automatiquement la base de données après la création des tables
        setTimeout(() => {
          populateDatabase();
        }, 1000);
      }
    });
  });
}

// Créer l'administrateur par défaut
async function createDefaultAdmin() {
  try {
    // Vérifier si l'admin existe déjà
    const existingAdmin = await getQuery('SELECT id FROM users WHERE email = ?', ['admin@etaxe.tg']);
    
    if (!existingAdmin) {
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('admin123', 12);
      
      await runQuery(`
        INSERT INTO users (nom, prenom, email, phone, password, adresse, numero_fiscale, secteur, role) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        'Administrateur',
        'Système',
        'admin@etaxe.tg',
        '+228 90 00 00 00',
        hashedPassword,
        'Lomé, Togo',
        'ADMIN-001',
        'Administration',
        'admin'
      ]);
      
      console.log('✅ Administrateur par défaut créé avec succès !');
      console.log('📧 Email: admin@etaxe.tg');
      console.log('🔑 Mot de passe: admin123');
      console.log('⚠️  IMPORTANT: Changez ce mot de passe après la première connexion !');
    } else {
      console.log('ℹ️  L\'administrateur par défaut existe déjà.');
    }
  } catch (error) {
    console.error('❌ Erreur lors de la création de l\'administrateur:', error);
  }
}

// Fonction pour peupler automatiquement la base de données
async function populateDatabase() {
  try {
    console.log('\n🌱 Peuplement automatique de la base de données...');
    
    // Données de test pour les utilisateurs
    const testUsers = [
      {
        nom: 'Kossi',
        prenom: 'Mensah',
        email: 'kossi.mensah@example.com',
        phone: '+228 90 11 22 33',
        password: 'password123',
        adresse: '123 Rue de la Paix, Lomé',
        numero_fiscale: 'FISC-001',
        secteur: 'Commerce',
        role: 'user'
      },
      {
        nom: 'Afi',
        prenom: 'Doe',
        email: 'afi.doe@example.com',
        phone: '+228 91 44 55 66',
        password: 'password123',
        adresse: '456 Avenue des Palmiers, Kara',
        numero_fiscale: 'FISC-002',
        secteur: 'Services',
        role: 'user'
      },
      {
        nom: 'Kodjo',
        prenom: 'Johnson',
        email: 'kodjo.johnson@example.com',
        phone: '+228 92 77 88 99',
        password: 'password123',
        adresse: '789 Boulevard du Marché, Sokodé',
        numero_fiscale: 'FISC-003',
        secteur: 'Industrie',
        role: 'user'
      },
      {
        nom: 'Mawuena',
        prenom: 'Smith',
        email: 'mawuena.smith@example.com',
        phone: '+228 93 00 11 22',
        password: 'password123',
        adresse: '321 Rue du Port, Aného',
        numero_fiscale: 'FISC-004',
        secteur: 'Transport',
        role: 'user'
      },
      {
        nom: 'Kossivi',
        prenom: 'Brown',
        email: 'kossivi.brown@example.com',
        phone: '+228 94 33 44 55',
        password: 'password123',
        adresse: '654 Avenue de l\'Indépendance, Kpalimé',
        numero_fiscale: 'FISC-005',
        secteur: 'Agriculture',
        role: 'user'
      }
    ];

    // Ajouter les utilisateurs de test
    for (const userData of testUsers) {
      const existingUser = await getQuery('SELECT id FROM users WHERE email = ?', [userData.email]);
      
      if (!existingUser) {
        const bcrypt = require('bcryptjs');
        const hashedPassword = await bcrypt.hash(userData.password, 12);
        
        await runQuery(`
          INSERT INTO users (nom, prenom, email, phone, password, adresse, numero_fiscale, secteur, role) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          userData.nom,
          userData.prenom,
          userData.email,
          userData.phone,
          hashedPassword,
          userData.adresse,
          userData.numero_fiscale,
          userData.secteur,
          userData.role
        ]);
        
        console.log(`✅ Utilisateur créé: ${userData.nom} ${userData.prenom}`);
      } else {
        console.log(`ℹ️  Utilisateur existe déjà: ${userData.nom} ${userData.prenom}`);
      }
    }

    // Récupérer les IDs des utilisateurs pour les taxes
    const users = await allQuery('SELECT id FROM users WHERE role = "user" ORDER BY id LIMIT 5');
    
    if (users && users.length > 0) {
      console.log(`📊 ${users.length} utilisateurs trouvés pour les taxes`);
      
      // Données de test pour les taxes
      const testTaxes = [
        {
          montant: 15000,
          type_taxe: 'Taxe sur les revenus',
          statut: 'payé',
          date_paiement: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          montant: 25000,
          type_taxe: 'Taxe foncière',
          statut: 'en_attente'
        },
        {
          montant: 12000,
          type_taxe: 'Taxe professionnelle',
          statut: 'payé',
          date_paiement: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          montant: 18000,
          type_taxe: 'Taxe sur les revenus',
          statut: 'en_attente'
        },
        {
          montant: 8000,
          type_taxe: 'Taxe de circulation',
          statut: 'payé',
          date_paiement: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          montant: 30000,
          type_taxe: 'Taxe foncière',
          statut: 'en_attente'
        },
        {
          montant: 9500,
          type_taxe: 'Taxe professionnelle',
          statut: 'en_attente'
        },
        {
          montant: 22000,
          type_taxe: 'Taxe sur les revenus',
          statut: 'payé',
          date_paiement: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
        }
      ];
      
      // Ajouter les taxes de test
      for (let i = 0; i < testTaxes.length; i++) {
        const taxData = testTaxes[i];
        const userId = users[i % users.length].id; // Répartir les taxes entre les utilisateurs
        
        // Vérifier si la taxe existe déjà
        const existingTax = await getQuery(
          'SELECT id FROM taxes WHERE user_id = ? AND montant = ? AND type_taxe = ?',
          [userId, taxData.montant, taxData.type_taxe]
        );
        
        if (!existingTax) {
          const values = [userId, taxData.montant, taxData.type_taxe, taxData.statut];
          
          if (taxData.date_paiement) {
            values.push(taxData.date_paiement);
            await runQuery(`
              INSERT INTO taxes (user_id, montant, type_taxe, statut, date_paiement) 
              VALUES (?, ?, ?, ?, ?)
            `, values);
          } else {
            await runQuery(`
              INSERT INTO taxes (user_id, montant, type_taxe, statut) 
              VALUES (?, ?, ?, ?)
            `, values);
          }
          
          console.log(`✅ Taxe créée: ${taxData.type_taxe} - ${taxData.montant} FCFA pour utilisateur ${userId}`);
        } else {
          console.log(`ℹ️  Taxe existe déjà: ${taxData.type_taxe} - ${taxData.montant} FCFA`);
        }
      }
    } else {
      console.log('⚠️  Aucun utilisateur trouvé pour créer les taxes');
    }

    // Afficher un résumé des données
    const stats = await allQuery(`
      SELECT 
        COUNT(*) as total_users,
        SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as admin_count,
        SUM(CASE WHEN role = 'user' THEN 1 ELSE 0 END) as user_count
      FROM users
    `);
    
    const taxStats = await allQuery(`
      SELECT 
        COUNT(*) as total_taxes,
        SUM(CASE WHEN statut = 'payé' THEN 1 ELSE 0 END) as paid_taxes,
        SUM(CASE WHEN statut = 'en_attente' THEN 1 ELSE 0 END) as unpaid_taxes,
        SUM(CASE WHEN statut = 'payé' THEN montant ELSE 0 END) as total_revenue
      FROM taxes
    `);
    
    console.log('\n📈 Résumé de la base de données:');
    console.log(`  - Utilisateurs totaux: ${stats[0].total_users}`);
    console.log(`  - Administrateurs: ${stats[0].admin_count}`);
    console.log(`  - Utilisateurs normaux: ${stats[0].user_count}`);
    console.log(`  - Taxes totales: ${taxStats[0].total_taxes}`);
    console.log(`  - Taxes payées: ${taxStats[0].paid_taxes}`);
    console.log(`  - Taxes impayées: ${taxStats[0].unpaid_taxes}`);
    console.log(`  - Recettes totales: ${taxStats[0].total_revenue} FCFA`);
    
    console.log('\n🎉 Peuplement automatique terminé !');
    console.log('📊 Données de test disponibles pour le dashboard admin');
    
  } catch (error) {
    console.error('❌ Erreur lors du peuplement automatique:', error);
    console.error('Détails de l\'erreur:', error.message);
  }
}

// Fonction pour exécuter des requêtes avec promesses
function runQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({ id: this.lastID, changes: this.changes });
      }
    });
  });
}

// Fonction pour récupérer une seule ligne
function getQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
}

// Fonction pour récupérer plusieurs lignes
function allQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

module.exports = {
  db,
  runQuery,
  getQuery,
  allQuery
}; 