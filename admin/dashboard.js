// Configuration de l'API
const API_BASE_URL = 'http://localhost:3000/api';

// Classe pour gérer le dashboard administrateur
class AdminClient {
  constructor() {
    this.token = localStorage.getItem('authToken');
    this.currentPeriod = 'monthly';
    this.charts = {};
  }

  // Vérifier l'authentification admin
  isAuthenticated() {
    return !!this.token;
  }

  // Obtenir les headers d'authentification
  getAuthHeaders() {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.token}`
    };
  }

  // Charger les statistiques du dashboard
  async loadDashboardStats() {
    try {
      console.log('Chargement des statistiques...');
      const response = await fetch(`${API_BASE_URL}/admin/stats`, {
        headers: this.getAuthHeaders()
      });

      const data = await response.json();
      console.log('Réponse stats:', data);

      if (data.success) {
        this.updateStatsCards(data.data);
      } else {
        console.error('Erreur lors du chargement des statistiques:', data.message);
        showMessage('Erreur lors du chargement des statistiques: ' + data.message, 'error');
      }
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
      showMessage('Erreur de connexion lors du chargement des statistiques', 'error');
    }
  }

  // Mettre à jour les cartes de statistiques
  updateStatsCards(stats) {
    console.log('Mise à jour des statistiques:', stats);
    
    // Total Utilisateurs
    const totalUsersElement = document.getElementById('totalUsers');
    if (totalUsersElement) {
      totalUsersElement.textContent = stats.totalUsers || 0;
    }

    // Recettes Totales
    const totalRevenueElement = document.getElementById('totalRevenue');
    if (totalRevenueElement) {
      totalRevenueElement.textContent = `${(stats.totalRevenue || 0).toLocaleString()} FCFA`;
    }

    // Taxes Impayées
    const unpaidTaxesElement = document.getElementById('unpaidTaxes');
    if (unpaidTaxesElement) {
      unpaidTaxesElement.textContent = stats.unpaidTaxes || 0;
    }

    // Taux de Paiement
    const paymentRateElement = document.getElementById('paymentRate');
    if (paymentRateElement) {
      const rate = stats.paymentRate || 0;
      paymentRateElement.textContent = `${rate}%`;
    }
  }

  // Charger le graphique des recettes
  async loadRevenueChart(period = 'monthly') {
    try {
      console.log('Chargement du graphique des recettes...');
      const response = await fetch(`${API_BASE_URL}/admin/revenue?period=${period}`, {
        headers: this.getAuthHeaders()
      });

      const data = await response.json();
      console.log('Réponse revenue:', data);

      if (data.success) {
        this.updateRevenueChart(data.data);
      } else {
        console.error('Erreur lors du chargement du graphique:', data.message);
        showMessage('Erreur lors du chargement du graphique: ' + data.message, 'error');
      }
    } catch (error) {
      console.error('Erreur lors du chargement du graphique:', error);
      showMessage('Erreur de connexion lors du chargement du graphique', 'error');
    }
  }

  // Mettre à jour le graphique des recettes
  updateRevenueChart(chartData) {
    const ctx = document.getElementById('revenueChart');
    if (!ctx) {
      console.error('Canvas revenueChart non trouvé');
      return;
    }

    // Détruire le graphique existant s'il y en a un
    if (this.charts.revenue) {
      this.charts.revenue.destroy();
    }

    console.log('Création du graphique avec les données:', chartData);

    this.charts.revenue = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: chartData.labels || ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun'],
        datasets: [{
          label: 'Recettes (FCFA)',
          data: chartData.data || [0, 0, 0, 0, 0, 0],
          backgroundColor: '#97DDE8',
          borderColor: '#134D80',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                return value.toLocaleString() + ' FCFA';
              }
            }
          }
        },
        plugins: {
          legend: {
            display: false
          }
        }
      }
    });
  }

  // Charger l'activité récente
  async loadRecentActivity() {
    try {
      console.log('Chargement de l\'activité récente...');
      const response = await fetch(`${API_BASE_URL}/admin/activity`, {
        headers: this.getAuthHeaders()
      });

      const data = await response.json();
      console.log('Réponse activity:', data);

      if (data.success) {
        this.updateRecentActivity(data.data);
      } else {
        console.error('Erreur lors du chargement de l\'activité:', data.message);
        showMessage('Erreur lors du chargement de l\'activité: ' + data.message, 'error');
      }
    } catch (error) {
      console.error('Erreur lors du chargement de l\'activité:', error);
      showMessage('Erreur de connexion lors du chargement de l\'activité', 'error');
    }
  }

  // Mettre à jour l'activité récente
  updateRecentActivity(activities) {
    const container = document.getElementById('recentActivity');
    if (!container) {
      console.error('Container recentActivity non trouvé');
      return;
    }

    container.innerHTML = '';

    if (!activities || activities.length === 0) {
      container.innerHTML = '<p class="text-gray-500 text-sm">Aucune activité récente</p>';
      return;
    }

    activities.forEach(activity => {
      const activityDiv = document.createElement('div');
      activityDiv.className = 'flex items-center p-3 bg-gray-50 rounded-lg';
      activityDiv.innerHTML = `
        <div class="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
        <div class="flex-1">
          <p class="text-sm font-medium text-gray-900">${activity.message}</p>
          <p class="text-xs text-gray-500">${activity.timeAgo}</p>
        </div>
      `;
      container.appendChild(activityDiv);
    });
  }

  // Charger les taxes impayées
  async loadUnpaidTaxes() {
    try {
      console.log('Chargement des taxes impayées...');
      const response = await fetch(`${API_BASE_URL}/admin/unpaid-taxes`, {
        headers: this.getAuthHeaders()
      });

      const data = await response.json();
      console.log('Réponse unpaid-taxes:', data);

      if (data.success) {
        this.updateUnpaidTaxesTable(data.data);
      } else {
        console.error('Erreur lors du chargement des taxes impayées:', data.message);
        showMessage('Erreur lors du chargement des taxes impayées: ' + data.message, 'error');
      }
    } catch (error) {
      console.error('Erreur lors du chargement des taxes impayées:', error);
      showMessage('Erreur de connexion lors du chargement des taxes impayées', 'error');
    }
  }

  // Mettre à jour le tableau des taxes impayées
  updateUnpaidTaxesTable(taxes) {
    const tbody = document.getElementById('unpaidTaxesTable');
    if (!tbody) {
      console.error('Tbody unpaidTaxesTable non trouvé');
      return;
    }

    tbody.innerHTML = '';

    if (!taxes || taxes.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" class="px-6 py-4 text-center text-gray-500">
            Aucune taxe impayée
          </td>
        </tr>
      `;
      return;
    }

    taxes.forEach(tax => {
      const row = document.createElement('tr');
      row.className = 'hover:bg-gray-50';
      row.innerHTML = `
        <td class="px-6 py-4 whitespace-nowrap">
          <div class="text-sm font-medium text-gray-900">${tax.nom} ${tax.prenom}</div>
          <div class="text-sm text-gray-500">${tax.email}</div>
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
          ${tax.numero_fiscale}
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
          ${tax.montant.toLocaleString()} FCFA
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
          ${new Date(tax.date_echeance).toLocaleDateString('fr-FR')}
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
          <button onclick="adminClient.remindPayment(${tax.id})" class="text-indigo-600 hover:text-indigo-900 mr-3">
            📧 Rappel
          </button>
          <button onclick="adminClient.markAsPaid(${tax.id})" class="text-green-600 hover:text-green-900">
            ✅ Marquer payé
          </button>
        </td>
      `;
      tbody.appendChild(row);
    });
  }

  // Envoyer un rappel de paiement
  async remindPayment(taxId) {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/remind-payment`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ taxId })
      });

      const data = await response.json();

      if (data.success) {
        showMessage('Rappel envoyé avec succès', 'success');
        // Recharger les taxes impayées
        this.loadUnpaidTaxes();
      } else {
        showMessage(data.message, 'error');
      }
    } catch (error) {
      console.error('Erreur lors de l\'envoi du rappel:', error);
      showMessage('Erreur lors de l\'envoi du rappel', 'error');
    }
  }

  // Marquer une taxe comme payée
  async markAsPaid(taxId) {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/mark-paid`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ taxId })
      });

      const data = await response.json();

      if (data.success) {
        showMessage('Taxe marquée comme payée', 'success');
        // Recharger les données
        this.loadDashboardStats();
        this.loadUnpaidTaxes();
      } else {
        showMessage(data.message, 'error');
      }
    } catch (error) {
      console.error('Erreur lors du marquage:', error);
      showMessage('Erreur lors du marquage', 'error');
    }
  }

  // Initialiser le dashboard
  async init() {
    console.log('Initialisation du dashboard admin...');
    console.log('Token:', this.token ? 'Présent' : 'Absent');
    
    try {
      await Promise.all([
        this.loadDashboardStats(),
        this.loadRevenueChart(),
        this.loadRecentActivity(),
        this.loadUnpaidTaxes()
      ]);
      console.log('Dashboard initialisé avec succès');
    } catch (error) {
      console.error('Erreur lors de l\'initialisation du dashboard:', error);
    }
  }
}

// Fonction pour afficher les messages
function showMessage(message, type = 'info') {
  // Créer un élément de message
  const messageDiv = document.createElement('div');
  messageDiv.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
    type === 'success' ? 'bg-green-500 text-white' :
    type === 'error' ? 'bg-red-500 text-white' :
    'bg-blue-500 text-white'
  }`;
  messageDiv.textContent = message;

  // Ajouter au DOM
  document.body.appendChild(messageDiv);

  // Supprimer après 3 secondes
  setTimeout(() => {
    if (messageDiv.parentNode) {
      messageDiv.parentNode.removeChild(messageDiv);
    }
  }, 3000);
}

// Initialiser le client admin
const adminClient = new AdminClient();

// Initialiser le dashboard quand la page est chargée
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM chargé, initialisation du dashboard...');
  adminClient.init();
}); 