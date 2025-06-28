const { seedDatabase } = require('./seed-data');
const { allQuery } = require('./database');

// Fonction pour tester le peuplement de la base de données
async function testSeedDatabase() {
  try {
    console.log('🧪 Test du peuplement de la base de données...\n');
    
    // Exécuter le peuplement
    await seedDatabase();
    
    console.log('\n📋 Vérification des données insérées...\n');
    
    // Vérifier les utilisateurs
    const users = await allQuery('SELECT id, nom, prenom, email, role FROM users ORDER BY id');
    console.log(`👥 Utilisateurs dans la base (${users.length}):`);
    users.forEach(user => {
      console.log(`  - ${user.nom} ${user.prenom} (${user.email}) - Rôle: ${user.role}`);
    });
    
    console.log('\n💰 Taxes dans la base:');
    const taxes = await allQuery(`
      SELECT t.id, t.montant, t.type_taxe, t.statut, t.date_paiement, 
             u.nom, u.prenom 
      FROM taxes t 
      JOIN users u ON t.user_id = u.id 
      ORDER BY t.id
    `);
    
    console.log(`📊 Taxes trouvées (${taxes.length}):`);
    taxes.forEach(tax => {
      const dateStr = tax.date_paiement ? ` - Payé le: ${new Date(tax.date_paiement).toLocaleDateString()}` : '';
      console.log(`  - ${tax.type_taxe}: ${tax.montant} FCFA (${tax.statut}) - ${tax.nom} ${tax.prenom}${dateStr}`);
    });
    
    // Statistiques
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
    
    console.log('\n📈 Statistiques:');
    console.log(`  - Utilisateurs totaux: ${stats[0].total_users}`);
    console.log(`  - Administrateurs: ${stats[0].admin_count}`);
    console.log(`  - Utilisateurs normaux: ${stats[0].user_count}`);
    console.log(`  - Taxes totales: ${taxStats[0].total_taxes}`);
    console.log(`  - Taxes payées: ${taxStats[0].paid_taxes}`);
    console.log(`  - Taxes impayées: ${taxStats[0].unpaid_taxes}`);
    console.log(`  - Recettes totales: ${taxStats[0].total_revenue} FCFA`);
    
    console.log('\n✅ Test terminé avec succès !');
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
    console.error('Détails:', error.message);
  }
}

// Exécuter le test si le script est appelé directement
if (require.main === module) {
  testSeedDatabase();
}

module.exports = { testSeedDatabase }; 