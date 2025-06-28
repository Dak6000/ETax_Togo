const { runQuery, getQuery, allQuery } = require('./database');

// Classe pour gérer les fonctionnalités d'administration
class AdminService {
  // Obtenir les statistiques du dashboard
  async getDashboardStats() {
    try {
      // Statistiques des utilisateurs
      const totalUsersResult = await getQuery('SELECT COUNT(*) as count FROM users WHERE role != "admin"');
      const totalUsers = totalUsersResult.count || 0;
      
      // Statistiques des taxes payées
      const paidTaxesResult = await getQuery(`
        SELECT COUNT(*) as count, SUM(montant) as total 
        FROM taxes 
        WHERE statut = 'payé'
      `);
      const paidTaxesCount = paidTaxesResult.count || 0;
      const totalRevenue = paidTaxesResult.total || 0;
      
      // Statistiques des taxes impayées
      const unpaidTaxesResult = await getQuery(`
        SELECT COUNT(*) as count, SUM(montant) as total 
        FROM taxes 
        WHERE statut = 'en_attente'
      `);
      const unpaidTaxesCount = unpaidTaxesResult.count || 0;
      
      // Calcul du taux de paiement
      const totalTaxes = paidTaxesCount + unpaidTaxesCount;
      const paymentRate = totalTaxes > 0 ? Math.round((paidTaxesCount / totalTaxes) * 100) : 0;

      return {
        success: true,
        data: {
          totalUsers: totalUsers,
          totalRevenue: totalRevenue,
          unpaidTaxes: unpaidTaxesCount,
          paymentRate: paymentRate
        }
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      return {
        success: false,
        message: 'Erreur lors de la récupération des statistiques'
      };
    }
  }

  // Obtenir les données du graphique de recettes
  async getRevenueChartData(period = 'monthly') {
    try {
      let query;
      let labels = [];
      
      if (period === 'monthly') {
        query = `
          SELECT 
            strftime('%m', created_at) as month,
            strftime('%Y', created_at) as year,
            SUM(montant) as total
          FROM taxes 
          WHERE statut = 'payé' 
          AND created_at >= date('now', '-12 months')
          GROUP BY year, month
          ORDER BY year, month
        `;
        
        // Générer les labels pour les 12 derniers mois
        const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sept', 'Oct', 'Nov', 'Déc'];
        const currentDate = new Date();
        for (let i = 11; i >= 0; i--) {
          const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
          labels.push(months[date.getMonth()]);
        }
      } else {
        // Annuel
        query = `
          SELECT 
            strftime('%Y', created_at) as year,
            SUM(montant) as total
          FROM taxes 
          WHERE statut = 'payé' 
          AND created_at >= date('now', '-5 years')
          GROUP BY year
          ORDER BY year
        `;
        
        // Générer les labels pour les 5 dernières années
        const currentYear = new Date().getFullYear();
        for (let i = 4; i >= 0; i--) {
          labels.push(String(currentYear - i));
        }
      }
      
      const results = await allQuery(query);
      
      // Mapper les résultats aux labels
      const data = labels.map(label => {
        const result = results.find(r => {
          if (period === 'monthly') {
            const monthIndex = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sept', 'Oct', 'Nov', 'Déc'].indexOf(label);
            return r.month === String(monthIndex + 1).padStart(2, '0');
          } else {
            return r.year === label;
          }
        });
        return result ? result.total / 1000 : 0; // Convertir en milliers
      });

      return {
        success: true,
        data: {
          labels,
          data
        }
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des données du graphique:', error);
      return {
        success: false,
        message: 'Erreur lors de la récupération des données du graphique'
      };
    }
  }

  // Obtenir l'activité récente
  async getRecentActivity(limit = 10) {
    try {
      const activities = await allQuery(`
        SELECT 
          'tax_payment' as type,
          t.created_at,
          t.montant,
          u.nom as user_name,
          u.prenom as user_firstname,
          u.secteur
        FROM taxes t
        JOIN users u ON t.user_id = u.id
        WHERE t.statut = 'payé'
        UNION ALL
        SELECT 
          'user_registration' as type,
          u.created_at,
          NULL as montant,
          u.nom as user_name,
          u.prenom as user_firstname,
          u.secteur
        FROM users u
        ORDER BY created_at DESC
        LIMIT ?
      `, [limit]);

      const formattedActivities = activities.map(activity => {
        let message = '';
        if (activity.type === 'tax_payment') {
          message = `Paiement de ${activity.montant.toLocaleString()} FCFA par ${activity.user_name} ${activity.user_firstname}`;
        } else if (activity.type === 'user_registration') {
          message = `Nouvel utilisateur inscrit: ${activity.user_name} ${activity.user_firstname} (${activity.secteur})`;
        }
        
        return {
          message: message,
          timeAgo: this.getTimeAgo(new Date(activity.created_at))
        };
      });

      return {
        success: true,
        data: formattedActivities
      };
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'activité récente:', error);
      return {
        success: false,
        message: 'Erreur lors de la récupération de l\'activité récente'
      };
    }
  }

  // Obtenir la liste des utilisateurs (commerçants)
  async getUsersList(limit = 10) {
    try {
      const users = await allQuery(`
        SELECT 
          u.id,
          u.nom,
          u.prenom,
          u.email,
          u.phone,
          u.secteur,
          u.created_at,
          COUNT(t.id) as total_taxes,
          SUM(CASE WHEN t.statut = 'payé' THEN 1 ELSE 0 END) as paid_taxes,
          SUM(CASE WHEN t.statut = 'en_attente' THEN 1 ELSE 0 END) as unpaid_taxes
        FROM users u
        LEFT JOIN taxes t ON u.id = t.user_id
        GROUP BY u.id
        ORDER BY u.created_at DESC
        LIMIT ?
      `, [limit]);

      return {
        success: true,
        data: users.map(user => ({
          ...user,
          status: this.getUserStatus(user.paid_taxes, user.unpaid_taxes)
        }))
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des utilisateurs:', error);
      return {
        success: false,
        message: 'Erreur lors de la récupération des utilisateurs'
      };
    }
  }

  // Obtenir les taxes impayées
  async getUnpaidTaxes(agentFilter = null) {
    try {
      let query = `
        SELECT 
          t.id,
          t.montant,
          t.created_at as date_echeance,
          t.type_taxe,
          u.nom,
          u.prenom,
          u.email,
          u.numero_fiscale,
          u.secteur,
          u.phone,
          julianday('now') - julianday(t.created_at) as days_overdue
        FROM taxes t
        JOIN users u ON t.user_id = u.id
        WHERE t.statut = 'en_attente'
      `;
      
      const params = [];
      if (agentFilter && agentFilter !== 'all') {
        // Pour l'instant, on n'a pas de table agents, donc on filtre par secteur
        query += ' AND u.secteur = ?';
        params.push(agentFilter);
      }
      
      query += ' ORDER BY t.created_at ASC';
      
      const unpaidTaxes = await allQuery(query, params);

      return {
        success: true,
        data: unpaidTaxes.map(tax => ({
          id: tax.id,
          nom: tax.nom,
          prenom: tax.prenom,
          email: tax.email,
          numero_fiscale: tax.numero_fiscale,
          montant: tax.montant,
          date_echeance: tax.date_echeance,
          type_taxe: tax.type_taxe,
          secteur: tax.secteur,
          phone: tax.phone,
          days_overdue: Math.floor(tax.days_overdue),
          status: this.getOverdueStatus(tax.days_overdue)
        }))
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des taxes impayées:', error);
      return {
        success: false,
        message: 'Erreur lors de la récupération des taxes impayées'
      };
    }
  }

  // Marquer une taxe comme payée
  async markTaxAsPaid(taxId) {
    try {
      await runQuery(`
        UPDATE taxes 
        SET statut = 'payé', date_paiement = datetime('now') 
        WHERE id = ?
      `, [taxId]);

      return {
        success: true,
        message: 'Taxe marquée comme payée avec succès'
      };
    } catch (error) {
      console.error('Erreur lors du marquage de la taxe:', error);
      return {
        success: false,
        message: 'Erreur lors du marquage de la taxe'
      };
    }
  }

  // Envoyer un rappel pour une taxe impayée
  async sendReminder(taxId) {
    try {
      // Ici on pourrait intégrer un service SMS ou email
      // Pour l'instant, on enregistre juste l'action
      await runQuery(`
        INSERT INTO reminders (tax_id, sent_at, status) 
        VALUES (?, datetime('now'), 'sent')
      `, [taxId]);

      return {
        success: true,
        message: 'Rappel envoyé avec succès'
      };
    } catch (error) {
      console.error('Erreur lors de l\'envoi du rappel:', error);
      return {
        success: false,
        message: 'Erreur lors de l\'envoi du rappel'
      };
    }
  }

  // Exporter les données en CSV
  async exportData(type, filters = {}) {
    try {
      let query;
      let filename;
      
      switch (type) {
        case 'unpaid_taxes':
          query = `
            SELECT 
              u.nom || ' ' || u.prenom as 'Nom Complet',
              u.secteur as 'Secteur',
              u.phone as 'Téléphone',
              t.montant as 'Montant Dû',
              t.type_taxe as 'Type de Taxe',
              t.created_at as 'Date d\'Échéance',
              julianday('now') - julianday(t.created_at) as 'Jours de Retard'
            FROM taxes t
            JOIN users u ON t.user_id = u.id
            WHERE t.statut = 'en_attente'
            ORDER BY t.created_at ASC
          `;
          filename = 'taxes_impayees.csv';
          break;
          
        case 'users':
          query = `
            SELECT 
              nom as 'Nom',
              prenom as 'Prénom',
              email as 'Email',
              phone as 'Téléphone',
              secteur as 'Secteur',
              numero_fiscale as 'Numéro Fiscal',
              created_at as 'Date d\'Inscription'
            FROM users
            ORDER BY created_at DESC
          `;
          filename = 'liste_commercants.csv';
          break;
          
        default:
          throw new Error('Type d\'export non supporté');
      }
      
      const data = await allQuery(query);
      
      return {
        success: true,
        data,
        filename
      };
    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
      return {
        success: false,
        message: 'Erreur lors de l\'export des données'
      };
    }
  }

  // Utilitaires
  getTimeAgo(date) {
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'À l\'instant';
    if (diffInSeconds < 3600) return `Il y a ${Math.floor(diffInSeconds / 60)} minutes`;
    if (diffInSeconds < 86400) return `Il y a ${Math.floor(diffInSeconds / 3600)} heures`;
    if (diffInSeconds < 2592000) return `Il y a ${Math.floor(diffInSeconds / 86400)} jours`;
    
    return date.toLocaleDateString('fr-FR');
  }

  getUserStatus(paidTaxes, unpaidTaxes) {
    if (unpaidTaxes === 0) return 'À jour';
    if (unpaidTaxes <= 2) return 'En retard';
    return 'Impayé';
  }

  getOverdueStatus(daysOverdue) {
    if (daysOverdue <= 7) return 'warning';
    if (daysOverdue <= 30) return 'danger';
    return 'critical';
  }
}

module.exports = new AdminService(); 