// Configuration de l'API
const API_BASE_URL = 'http://localhost:3000/api';

// Classe pour gérer le dashboard administrateur
class AdminClient {
  constructor() {
    this.token = localStorage.getItem('adminToken');
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
      const response = await fetch(`${API_BASE_URL}/admin/stats`, {
        headers: this.getAuthHeaders()
      });

      const data = await response.json();

      if (data.success) {
        this.updateStatsCards(data.data);
      } else {
        console.error('Erreur lors du chargement des statistiques:', data.message);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
    }
  }

  // Mettre à jour les cartes de statistiques
  updateStatsCards(stats) {
    // Total Agents
    const agentsCard = document.querySelector('#agentsCount');
    if (agentsCard) {
      agentsCard.textContent = stats.totalAgents;
      const agentsChange = document.querySelector('#agentsChange');
      if (agentsChange) {
        agentsChange.textContent = `${stats.agentsGrowth > 0 ? '+' : ''}${stats.agentsGrowth}%`;
        agentsChange.className = `text-sm font-medium ${stats.agentsGrowth >= 0 ? 'text-green-500' : 'text-red-500'}`;
      }
    }

    // Total Commerçants
    const merchantsCard = document.querySelector('#merchantsCount');
    if (merchantsCard) {
      merchantsCard.textContent = stats.totalMerchants.toLocaleString();
      const merchantsChange = document.querySelector('#merchantsChange');
      if (merchantsChange) {
        merchantsChange.textContent = `${stats.merchantsGrowth > 0 ? '+' : ''}${stats.merchantsGrowth}%`;
        merchantsChange.className = `text-sm font-medium ${stats.merchantsGrowth >= 0 ? 'text-green-500' : 'text-red-500'}`;
      }
    }

    // Taxes payées
    const paidTaxesCard = document.querySelector('#paidTaxesCount');
    if (paidTaxesCard) {
      paidTaxesCard.textContent = stats.paidTaxes.toLocaleString();
      const paidTaxesChange = document.querySelector('#paidTaxesChange');
      if (paidTaxesChange) {
        paidTaxesChange.textContent = `${stats.paidTaxesGrowth > 0 ? '+' : ''}${stats.paidTaxesGrowth}%`;
        paidTaxesChange.className = `text-sm font-medium ${stats.paidTaxesGrowth >= 0 ? 'text-green-500' : 'text-red-500'}`;
      }
    }

    // Taxes impayées
    const unpaidTaxesCard = document.querySelector('#unpaidTaxesCount');
    if (unpaidTaxesCard) {
      unpaidTaxesCard.textContent = stats.unpaidTaxes.toLocaleString();
      const unpaidTaxesChange = document.querySelector('#unpaidTaxesChange');
      if (unpaidTaxesChange) {
        unpaidTaxesChange.textContent = `${stats.unpaidTaxesGrowth > 0 ? '+' : ''}${stats.unpaidTaxesGrowth}%`;
        unpaidTaxesChange.className = `text-sm font-medium ${stats.unpaidTaxesGrowth >= 0 ? 'text-red-500' : 'text-green-500'}`;
      }
    }
  }

  // Charger le graphique des recettes
  async loadRevenueChart(period = 'monthly') {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/revenue?period=${period}`, {
        headers: this.getAuthHeaders()
      });

      const data = await response.json();

      if (data.success) {
        this.updateRevenueChart(data.data);
      } else {
        console.error('Erreur lors du chargement du graphique:', data.message);
      }
    } catch (error) {
      console.error('Erreur lors du chargement du graphique:', error);
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
  async loadRecentActivity() {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/activity`, {
        headers: this.getAuthHeaders()
      });

      const data = await response.json();

      if (data.success) {
        this.updateRecentActivity(data.data);
      } else {
        console.error('Erreur lors du chargement de l\'activité:', data.message);
      }
    } catch (error) {
      console.error('Erreur lors du chargement de l\'activité:', error);
    }
  }

  // Mettre à jour l'activité récente
  updateRecentActivity(activities) {
    const container = document.querySelector('#recentActivity');
    if (!container) return;

    container.innerHTML = '';

    activities.forEach(activity => {
      const activityDiv = document.createElement('div');
      activityDiv.className = 'flex items-start';
      activityDiv.innerHTML = `
        <div class="w-8 h-8 rounded-full bg-primary bg-opacity-20 flex items-center justify-center mr-3 mt-1">
          <i class="fas ${activity.icon} text-primary text-sm"></i>
        </div>
        <div>
          <p class="text-sm font-medium">${activity.message}</p>
          <p class="text-xs text-gray-500">${activity.timeAgo}</p>
        </div>
      `;
      container.appendChild(activityDiv);
    });
  }

  // Charger la liste des agents
  async loadAgents() {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/agents`, {
        headers: this.getAuthHeaders()
      });

      const data = await response.json();

      if (data.success) {
        this.updateAgentsTable(data.data);
      } else {
        console.error('Erreur lors du chargement des agents:', data.message);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des agents:', error);
    }
  }

  // Mettre à jour le tableau des agents
  updateAgentsTable(agents) {
    const tbody = document.querySelector('#agentsTable tbody');
    if (!tbody) return;

    tbody.innerHTML = '';

    agents.forEach(agent => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td class="px-6 py-4 whitespace-nowrap">
          <div class="flex items-center">
            <div class="flex-shrink-0 h-10 w-10 rounded-full bg-primary bg-opacity-20 flex items-center justify-center">
              <i class="fas fa-user text-primary"></i>
            </div>
            <div class="ml-4">
              <div class="text-sm font-medium text-gray-900">${agent.nom} ${agent.prenom}</div>
              <div class="text-sm text-gray-500">${agent.email}</div>
            </div>
          </div>
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${agent.zone}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${agent.merchantsCount}</td>
        <td class="px-6 py-4 whitespace-nowrap">
          <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${agent.status === 'actif' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}">${agent.status}</span>
        </td>
      `;
      tbody.appendChild(row);
    });
  }

  // Charger la liste des commerçants
  async loadMerchants() {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/merchants`, {
        headers: this.getAuthHeaders()
      });

      const data = await response.json();

      if (data.success) {
        this.updateMerchantsTable(data.data);
      } else {
        console.error('Erreur lors du chargement des commerçants:', data.message);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des commerçants:', error);
    }
  }

  // Mettre à jour le tableau des commerçants
  updateMerchantsTable(merchants) {
    const tbody = document.querySelector('#merchantsTable tbody');
    if (!tbody) return;

    tbody.innerHTML = '';

    merchants.forEach(merchant => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td class="px-6 py-4 whitespace-nowrap">
          <div class="flex items-center">
            <div class="flex-shrink-0 h-10 w-10 rounded-full bg-primary bg-opacity-20 flex items-center justify-center">
              <i class="fas fa-store text-primary"></i>
            </div>
            <div class="ml-4">
              <div class="text-sm font-medium text-gray-900">${merchant.nom}</div>
              <div class="text-sm text-gray-500">${merchant.phone}</div>
            </div>
          </div>
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${merchant.secteur}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${merchant.agent}</td>
        <td class="px-6 py-4 whitespace-nowrap">
          <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${merchant.status === 'à_jour' ? 'bg-green-100 text-green-800' : merchant.status === 'en_retard' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}">${merchant.status}</span>
        </td>
      `;
      tbody.appendChild(row);
    });
  }

  // Charger les taxes impayées
  async loadUnpaidTaxes(agentFilter = null) {
    try {
      const url = agentFilter ? 
        `${API_BASE_URL}/admin/unpaid-taxes?agent=${encodeURIComponent(agentFilter)}` :
        `${API_BASE_URL}/admin/unpaid-taxes`;

      const response = await fetch(url, {
        headers: this.getAuthHeaders()
      });

      const data = await response.json();

      if (data.success) {
        this.updateUnpaidTaxesTable(data.data);
      } else {
        console.error('Erreur lors du chargement des taxes impayées:', data.message);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des taxes impayées:', error);
    }
  }

  // Mettre à jour le tableau des taxes impayées
  updateUnpaidTaxesTable(taxes) {
    const tbody = document.querySelector('#unpaidTaxesTable tbody');
    if (!tbody) return;

    tbody.innerHTML = '';

    taxes.forEach(tax => {
      const row = document.createElement('tr');
      row.innerHTML = `
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
          <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${tax.daysLate <= 7 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}">${tax.daysLate} jours</span>
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
          <button class="text-primary hover:text-secondary mr-3" onclick="adminClient.remindPayment(${tax.id})">Rappeler</button>
          <button class="text-green-600 hover:text-green-900" onclick="adminClient.markAsPaid(${tax.id})">Marquer payé</button>
        </td>
      `;
      tbody.appendChild(row);
    });
  }

  // Rappeler un paiement
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

  // Exporter des données
  async exportData(type, filters = {}) {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/export`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ type, filters })
      });

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `etax_${type}_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      showMessage('Export réussi', 'success');
    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
      showMessage('Erreur lors de l\'export', 'error');
    }
  }
}

// Instance globale de l'admin client
const adminClient = new AdminClient();

// Fonction pour afficher les messages
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

// Initialisation du dashboard
document.addEventListener('DOMContentLoaded', () => {
  // Vérifier l'authentification
  if (!adminClient.isAuthenticated()) {
    window.location.href = '/admin/login.html';
    return;
  }

  // Charger les données initiales
  adminClient.loadDashboardStats();
  adminClient.loadRevenueChart();
  adminClient.loadRecentActivity();
  adminClient.loadAgents();
  adminClient.loadMerchants();
  adminClient.loadUnpaidTaxes();

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

  // Gestionnaire pour les boutons de période du graphique
  const periodButtons = document.querySelectorAll('[data-period]');
  periodButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      const period = e.target.dataset.period;
      
      // Mettre à jour les styles des boutons
      periodButtons.forEach(btn => {
        btn.classList.remove('bg-primary', 'text-dark');
        btn.classList.add('bg-gray-100', 'text-gray-700');
      });
      e.target.classList.remove('bg-gray-100', 'text-gray-700');
      e.target.classList.add('bg-primary', 'text-dark');

      // Charger le graphique avec la nouvelle période
      adminClient.loadRevenueChart(period);
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