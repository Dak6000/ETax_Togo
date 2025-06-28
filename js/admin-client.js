// Configuration de l'API Admin
const ADMIN_API_BASE_URL = 'http://localhost:3000/api/admin';

// Classe pour gérer l'interface d'administration
class AdminClient {
  constructor() {
    this.token = localStorage.getItem('authToken');
    this.charts = {};
    this.currentPeriod = 'monthly';
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
      const response = await fetch(`${ADMIN_API_BASE_URL}/stats`, {
        headers: this.getAuthHeaders()
      });

      const data = await response.json();

      if (data.success) {
        this.updateStatsCards(data.data);
      } else {
        showMessage(data.message, 'error');
      }
    } catch (error) {
      console.error('Erreur lors du chargement des stats:', error);
      showMessage('Erreur de connexion au serveur', 'error');
    }
  }

  // Mettre à jour les cartes de statistiques
  updateStatsCards(stats) {
    const cards = [
      { id: 'totalAgents', value: stats.totalAgents, change: stats.agentsChange },
      { id: 'totalUsers', value: stats.totalUsers, change: stats.usersChange },
      { id: 'paidTaxes', value: stats.paidTaxes, change: stats.paidTaxesChange },
      { id: 'unpaidTaxes', value: stats.unpaidTaxes, change: stats.unpaidTaxesChange }
    ];

    cards.forEach(card => {
      const element = document.getElementById(card.id);
      if (element) {
        element.textContent = card.value.toLocaleString();
      }

      const changeElement = document.querySelector(`[data-change="${card.id}"]`);
      if (changeElement) {
        const isPositive = card.change >= 0;
        changeElement.textContent = `${isPositive ? '+' : ''}${card.change.toFixed(1)}%`;
        changeElement.className = `text-sm font-medium ${isPositive ? 'text-green-500' : 'text-red-500'}`;
      }
    });
  }

  // Charger le graphique des recettes
  async loadRevenueChart(period = 'monthly') {
    try {
      const response = await fetch(`${ADMIN_API_BASE_URL}/revenue-chart?period=${period}`, {
        headers: this.getAuthHeaders()
      });

      const data = await response.json();

      if (data.success) {
        this.updateRevenueChart(data.data);
      } else {
        showMessage(data.message, 'error');
      }
    } catch (error) {
      console.error('Erreur lors du chargement du graphique:', error);
      showMessage('Erreur de connexion au serveur', 'error');
    }
  }

  // Mettre à jour le graphique des recettes
  updateRevenueChart(chartData) {
    const ctx = document.getElementById('revenueChart');
    if (!ctx) return;

    // Détruire le graphique existant s'il y en a un
    if (this.charts.revenue) {
      this.charts.revenue.destroy();
    }

    this.charts.revenue = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: chartData.labels,
        datasets: [{
          label: 'Recettes (en milliers FCFA)',
          data: chartData.data,
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
            beginAtZero: true
          }
        }
      }
    });
  }

  // Charger l'activité récente
  async loadRecentActivity(limit = 10) {
    try {
      const response = await fetch(`${ADMIN_API_BASE_URL}/recent-activity?limit=${limit}`, {
        headers: this.getAuthHeaders()
      });

      const data = await response.json();

      if (data.success) {
        this.updateRecentActivity(data.data);
      } else {
        showMessage(data.message, 'error');
      }
    } catch (error) {
      console.error('Erreur lors du chargement de l\'activité:', error);
      showMessage('Erreur de connexion au serveur', 'error');
    }
  }

  // Mettre à jour l'activité récente
  updateRecentActivity(activities) {
    const container = document.querySelector('.recent-activity-container');
    if (!container) return;

    container.innerHTML = activities.map(activity => `
      <div class="flex items-start">
        <div class="w-8 h-8 rounded-full bg-primary bg-opacity-20 flex items-center justify-center mr-3 mt-1">
          <i class="fas ${this.getActivityIcon(activity.type)} text-primary text-sm"></i>
        </div>
        <div>
          <p class="text-sm font-medium">${activity.message}</p>
          <p class="text-xs text-gray-500">${activity.timeAgo}</p>
        </div>
      </div>
    `).join('');
  }

  // Obtenir l'icône selon le type d'activité
  getActivityIcon(type) {
    const icons = {
      'user_registered': 'fa-user',
      'payment_made': 'fa-money-bill-wave',
      'tax_overdue': 'fa-exclamation-triangle',
      'agent_added': 'fa-user-plus',
      'tax_paid': 'fa-check-circle'
    };
    return icons[type] || 'fa-info-circle';
  }

  // Charger la liste des utilisateurs
  async loadUsersList(limit = 10) {
    try {
      const response = await fetch(`${ADMIN_API_BASE_URL}/users?limit=${limit}`, {
        headers: this.getAuthHeaders()
      });

      const data = await response.json();

      if (data.success) {
        this.updateUsersTable(data.data);
      } else {
        showMessage(data.message, 'error');
      }
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error);
      showMessage('Erreur de connexion au serveur', 'error');
    }
  }

  // Mettre à jour le tableau des utilisateurs
  updateUsersTable(users) {
    const tbody = document.querySelector('#usersTable tbody');
    if (!tbody) return;

    tbody.innerHTML = users.map(user => `
      <tr>
        <td class="px-6 py-4 whitespace-nowrap">
          <div class="flex items-center">
            <div class="flex-shrink-0 h-10 w-10 rounded-full bg-primary bg-opacity-20 flex items-center justify-center">
              <i class="fas fa-user text-primary"></i>
            </div>
            <div class="ml-4">
              <div class="text-sm font-medium text-gray-900">${user.nom} ${user.prenom}</div>
              <div class="text-sm text-gray-500">${user.email}</div>
            </div>
          </div>
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${user.adresse || 'Non spécifiée'}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${user.secteur}</td>
        <td class="px-6 py-4 whitespace-nowrap">
          <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${this.getStatusClass(user.status)}">
            ${user.status}
          </span>
        </td>
      </tr>
    `).join('');
  }

  // Charger les taxes impayées
  async loadUnpaidTaxes(agent = null) {
    try {
      const url = agent ? 
        `${ADMIN_API_BASE_URL}/unpaid-taxes?agent=${encodeURIComponent(agent)}` :
        `${ADMIN_API_BASE_URL}/unpaid-taxes`;

      const response = await fetch(url, {
        headers: this.getAuthHeaders()
      });

      const data = await response.json();

      if (data.success) {
        this.updateUnpaidTaxesTable(data.data);
      } else {
        showMessage(data.message, 'error');
      }
    } catch (error) {
      console.error('Erreur lors du chargement des taxes impayées:', error);
      showMessage('Erreur de connexion au serveur', 'error');
    }
  }

  // Mettre à jour le tableau des taxes impayées
  updateUnpaidTaxesTable(taxes) {
    const tbody = document.querySelector('#unpaidTaxesTable tbody');
    if (!tbody) return;

    tbody.innerHTML = taxes.map(tax => `
      <tr>
        <td class="px-6 py-4 whitespace-nowrap">
          <div class="flex items-center">
            <div class="flex-shrink-0 h-10 w-10 rounded-full bg-primary bg-opacity-20 flex items-center justify-center">
              <i class="fas fa-store text-primary"></i>
            </div>
            <div class="ml-4">
              <div class="text-sm font-medium text-gray-900">${tax.merchantName}</div>
              <div class="text-sm text-gray-500">${tax.secteur}</div>
            </div>
          </div>
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${tax.agentName}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${tax.amount.toLocaleString()} FCFA</td>
        <td class="px-6 py-4 whitespace-nowrap">
          <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${this.getOverdueClass(tax.daysOverdue)}">
            ${tax.daysOverdue} jours
          </span>
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
          <button class="text-primary hover:text-secondary mr-3" onclick="adminClient.sendReminder(${tax.id})">
            Rappeler
          </button>
          <button class="text-green-600 hover:text-green-900" onclick="adminClient.markTaxAsPaid(${tax.id})">
            Marquer payé
          </button>
        </td>
      </tr>
    `).join('');
  }

  // Marquer une taxe comme payée
  async markTaxAsPaid(taxId) {
    try {
      const response = await fetch(`${ADMIN_API_BASE_URL}/mark-tax-paid/${taxId}`, {
        method: 'POST',
        headers: this.getAuthHeaders()
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
      console.error('Erreur lors du marquage de la taxe:', error);
      showMessage('Erreur de connexion au serveur', 'error');
    }
  }

  // Envoyer un rappel
  async sendReminder(taxId) {
    try {
      const response = await fetch(`${ADMIN_API_BASE_URL}/send-reminder/${taxId}`, {
        method: 'POST',
        headers: this.getAuthHeaders()
      });

      const data = await response.json();

      if (data.success) {
        showMessage('Rappel envoyé avec succès', 'success');
      } else {
        showMessage(data.message, 'error');
      }
    } catch (error) {
      console.error('Erreur lors de l\'envoi du rappel:', error);
      showMessage('Erreur de connexion au serveur', 'error');
    }
  }

  // Exporter les données
  async exportData(type, filters = {}) {
    try {
      const queryParams = new URLSearchParams();
      if (Object.keys(filters).length > 0) {
        queryParams.append('filters', JSON.stringify(filters));
      }

      const response = await fetch(`${ADMIN_API_BASE_URL}/export/${type}?${queryParams}`, {
        headers: this.getAuthHeaders()
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = response.headers.get('content-disposition')?.split('filename=')[1] || `${type}_export.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        showMessage('Export réussi', 'success');
      } else {
        const data = await response.json();
        showMessage(data.message, 'error');
      }
    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
      showMessage('Erreur lors de l\'export', 'error');
    }
  }

  // Obtenir la classe CSS pour le statut
  getStatusClass(status) {
    const classes = {
      'À jour': 'bg-green-100 text-green-800',
      'En retard': 'bg-yellow-100 text-yellow-800',
      'Impayé': 'bg-red-100 text-red-800',
      'Actif': 'bg-green-100 text-green-800',
      'En congé': 'bg-yellow-100 text-yellow-800'
    };
    return classes[status] || 'bg-gray-100 text-gray-800';
  }

  // Obtenir la classe CSS pour le retard
  getOverdueClass(daysOverdue) {
    if (daysOverdue <= 7) return 'bg-yellow-100 text-yellow-800';
    if (daysOverdue <= 30) return 'bg-red-100 text-red-800';
    return 'bg-red-200 text-red-900';
  }

  // Initialiser le dashboard
  async initDashboard() {
    await Promise.all([
      this.loadDashboardStats(),
      this.loadRevenueChart(this.currentPeriod),
      this.loadRecentActivity(),
      this.loadUsersList(),
      this.loadUnpaidTaxes()
    ]);
  }

  // Changer la période du graphique
  changeChartPeriod(period) {
    this.currentPeriod = period;
    this.loadRevenueChart(period);
    
    // Mettre à jour les boutons
    document.querySelectorAll('.chart-period-btn').forEach(btn => {
      btn.classList.remove('bg-primary', 'text-dark');
      btn.classList.add('bg-gray-100', 'text-gray-700');
    });
    
    const activeBtn = document.querySelector(`[data-period="${period}"]`);
    if (activeBtn) {
      activeBtn.classList.remove('bg-gray-100', 'text-gray-700');
      activeBtn.classList.add('bg-primary', 'text-dark');
    }
  }
}

// Instance globale de l'admin client
const adminClient = new AdminClient();

// Fonctions utilitaires
function showMessage(message, type = 'info') {
  const messageDiv = document.createElement('div');
  messageDiv.className = `message message-${type}`;
  messageDiv.textContent = message;
  
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

  document.body.appendChild(messageDiv);

  setTimeout(() => {
    if (messageDiv.parentNode) {
      messageDiv.parentNode.removeChild(messageDiv);
    }
  }, 5000);
}

// Initialisation quand le DOM est chargé
document.addEventListener('DOMContentLoaded', () => {
  // Initialiser le dashboard
  adminClient.initDashboard();

  // Gestionnaire pour le toggle de la sidebar
  const sidebarToggle = document.getElementById('sidebarToggle');
  const sidebar = document.querySelector('.sidebar');
  const mainContent = document.querySelector('.main-content');

  if (sidebarToggle && sidebar && mainContent) {
    sidebarToggle.addEventListener('click', () => {
      sidebar.classList.toggle('collapsed');
    });

    // Pour mobile
    if (window.innerWidth <= 768) {
      sidebar.classList.add('collapsed');
      sidebarToggle.addEventListener('click', () => {
        sidebar.classList.toggle('active');
      });
    }
  }

  // Gestionnaires pour les boutons de période du graphique
  document.querySelectorAll('.chart-period-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const period = btn.dataset.period;
      adminClient.changeChartPeriod(period);
    });
  });

  // Gestionnaire pour le filtre des agents
  const agentFilter = document.querySelector('#agentFilter');
  if (agentFilter) {
    agentFilter.addEventListener('change', (e) => {
      const selectedAgent = e.target.value;
      adminClient.loadUnpaidTaxes(selectedAgent === 'all' ? null : selectedAgent);
    });
  }

  // Gestionnaire pour l'export
  const exportBtn = document.querySelector('#exportBtn');
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      const agentFilter = document.querySelector('#agentFilter');
      const filters = agentFilter && agentFilter.value !== 'all' ? 
        { agent: agentFilter.value } : {};
      adminClient.exportData('unpaid-taxes', filters);
    });
  }

  // Actualisation automatique toutes les 5 minutes
  setInterval(() => {
    adminClient.loadDashboardStats();
    adminClient.loadRecentActivity();
  }, 5 * 60 * 1000);
});

// Exporter pour utilisation globale
window.AdminClient = AdminClient;
window.adminClient = adminClient;
window.showMessage = showMessage; 