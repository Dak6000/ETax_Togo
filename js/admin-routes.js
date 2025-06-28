const express = require('express');
const router = express.Router();
const adminService = require('./admin');
const { authenticateToken, requireAdmin } = require('./auth');

// Appliquer l'authentification et les droits admin à toutes les routes
router.use(authenticateToken);
router.use(requireAdmin);

// Route pour obtenir les statistiques du dashboard
router.get('/stats', async (req, res) => {
  try {
    const result = await adminService.getDashboardStats();
    res.json(result);
  } catch (error) {
    console.error('Erreur route stats:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
});

// Route pour obtenir les données du graphique de recettes
router.get('/revenue', async (req, res) => {
  try {
    const { period = 'monthly' } = req.query;
    const result = await adminService.getRevenueChartData(period);
    res.json(result);
  } catch (error) {
    console.error('Erreur route revenue:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
});

// Route pour obtenir l'activité récente
router.get('/activity', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const result = await adminService.getRecentActivity(parseInt(limit));
    res.json(result);
  } catch (error) {
    console.error('Erreur route activity:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
});

// Route pour obtenir la liste des utilisateurs
router.get('/users', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const result = await adminService.getUsersList(parseInt(limit));
    res.json(result);
  } catch (error) {
    console.error('Erreur route users:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
});

// Route pour obtenir les taxes impayées
router.get('/unpaid-taxes', async (req, res) => {
  try {
    const { agent } = req.query;
    const result = await adminService.getUnpaidTaxes(agent);
    res.json(result);
  } catch (error) {
    console.error('Erreur route unpaid-taxes:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
});

// Route pour marquer une taxe comme payée
router.post('/mark-paid', async (req, res) => {
  try {
    const { taxId } = req.body;
    const result = await adminService.markTaxAsPaid(taxId);
    res.json(result);
  } catch (error) {
    console.error('Erreur route mark-paid:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
});

// Route pour envoyer un rappel
router.post('/remind-payment', async (req, res) => {
  try {
    const { taxId } = req.body;
    const result = await adminService.sendReminder(taxId);
    res.json(result);
  } catch (error) {
    console.error('Erreur route remind-payment:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
});

// Route pour exporter les données
router.get('/export/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const { filters } = req.query;
    
    const result = await adminService.exportData(type, filters ? JSON.parse(filters) : {});
    
    if (result.success) {
      // Convertir les données en CSV
      const csvData = convertToCSV(result.data);
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
      res.send(csvData);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Erreur route export:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
});

// Fonction utilitaire pour convertir les données en CSV
function convertToCSV(data) {
  if (!data || data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  const csvRows = [];
  
  // Ajouter les en-têtes
  csvRows.push(headers.join(','));
  
  // Ajouter les données
  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header];
      // Échapper les virgules et guillemets
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    });
    csvRows.push(values.join(','));
  }
  
  return csvRows.join('\n');
}

module.exports = router; 