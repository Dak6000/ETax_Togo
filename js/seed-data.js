const bcrypt = require('bcryptjs');
const { runQuery, getQuery, allQuery } = require('./database');

// Données de test pour peupler la base de données
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

const testTaxes = [
  {
    user_id: 2,
    montant: 15000,
    type_taxe: 'Taxe sur les revenus',
    statut: 'payé',
    date_paiement: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    user_id: 3,
    montant: 25000,
    type_taxe: 'Taxe foncière',
    statut: 'en_attente'
  },
  {
    user_id: 4,
    montant: 12000,
    type_taxe: 'Taxe professionnelle',
    statut: 'payé',
    date_paiement: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    user_id: 5,
    montant: 18000,
    type_taxe: 'Taxe sur les revenus',
    statut: 'en_attente'
  },
  {
    user_id: 2,
    montant: 8000,
    type_taxe: 'Taxe de circulation',
    statut: 'payé',
    date_paiement: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    user_id: 3,
    montant: 30000,
    type_taxe: 'Taxe foncière',
    statut: 'en_attente'
  },
  {
    user_id: 4,
    montant: 9500,
    type_taxe: 'Taxe professionnelle',
    statut: 'en_attente'
  },
  {
    user_id: 5,
    montant: 22000,
    type_taxe: 'Taxe sur les revenus',
    statut: 'payé',
    date_paiement: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
  }
];

// Fonction pour ajouter les données de test
async function seedDatabase() {
  try {
    console.log('🌱 Début du peuplement de la base de données...');

    // Ajouter les utilisateurs de test
    for (const userData of testUsers) {
      // Vérifier si l'utilisateur existe déjà
      const existingUser = await getQuery('SELECT id FROM users WHERE email = ?', [userData.email]);
      
      if (!existingUser) {
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

    // Récupérer les IDs des utilisateurs pour les taxes (CORRECTION: utiliser allQuery)
    const users = await allQuery('SELECT id FROM users WHERE role = "user" ORDER BY id LIMIT 5');
    
    if (users && users.length > 0) {
      console.log(`📊 ${users.length} utilisateurs trouvés pour les taxes`);
      
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

    console.log('🎉 Peuplement de la base de données terminé !');
    console.log('📊 Données de test disponibles pour le dashboard admin');
    
  } catch (error) {
    console.error('❌ Erreur lors du peuplement de la base de données:', error);
    console.error('Détails de l\'erreur:', error.message);
  }
}

// Exporter la fonction pour l'utiliser dans database.js
module.exports = { seedDatabase };

// Si le script est exécuté directement
if (require.main === module) {
  seedDatabase();
} 