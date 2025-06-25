<script setup>
import { ref, computed, onMounted, nextTick, watchEffect } from 'vue';
import journalService from '@/services/journalService.js';
import Chart from 'chart.js/auto';

const grandLivre = ref([]);
const error = ref(null);
const dateMin = ref(null);
const dateMax = ref(null);
const referenceFilter = ref('');
const showModal = ref(false);
const selectedAccount = ref(null);
const chartInstance = ref(null);

// Formater les montants en devise
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'MGA',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount || 0);
};

// Formater les dates
const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

// Réinitialiser les filtres
const resetFilters = () => {
  dateMin.value = null;
  dateMax.value = null;
  referenceFilter.value = '';
};

// Ouvrir la modale
const openModal = async (accountName) => {
  selectedAccount.value = accountName;
  showModal.value = true;
};

// Fermer la modale
const closeModal = () => {
  showModal.value = false;
  selectedAccount.value = null;
  
  if (chartInstance.value) {
    chartInstance.value.destroy();
    chartInstance.value = null;
  }
};

// Données de la balance
const balanceData = computed(() => {
  const grouped = {};

  // Filtrer les journaux
  const filteredJournals = grandLivre.value.filter(journal => {
    let matches = true;
    const journalDate = new Date(journal.DateAcct);
    
    if (dateMin.value) {
      const minDate = new Date(dateMin.value);
      matches = matches && journalDate >= minDate;
    }
    if (dateMax.value) {
      const maxDate = new Date(dateMax.value);
      maxDate.setHours(23, 59, 59, 999);
      matches = matches && journalDate <= maxDate;
    }
    if (referenceFilter.value) {
      const refLower = referenceFilter.value.toLowerCase();
      matches = matches && (
        (journal.Description || '').toLowerCase().includes(refLower) ||
        (journal.DocumentNo || '').toLowerCase().includes(refLower)
      );
    }

    return matches;
  });

  // Regrouper par compte
  filteredJournals.forEach(journal => {
    (journal.GL_JournalLine || []).forEach(line => {
      const accountName = line.Account_ID?.identifier || 'Compte inconnu';
      if (!grouped[accountName]) {
        grouped[accountName] = {
          totalDebit: 0,
          totalCredit: 0,
          solde: 0,
        };
      }
      grouped[accountName].totalDebit += line.AmtAcctDr || 0;
      grouped[accountName].totalCredit += line.AmtAcctCr || 0;
      grouped[accountName].solde = grouped[accountName].totalDebit - grouped[accountName].totalCredit;
    });
  });

  // Trier les comptes par nom
  return Object.fromEntries(
    Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b))
  );
});

// Grouper les comptes par types
const groupedBalanceData = computed(() => {
  const grouped = {};
  Object.entries(balanceData.value).forEach(([accountName, account]) => {
    const accountType = accountName.charAt(0);
    if (!grouped[accountType]) {
      grouped[accountType] = {
        data : [],
        totalDebit: 0,
        totalCredit: 0,
        solde: 0,
      };
    }
    grouped[accountType].data.push({ name: accountName, ...account });
    grouped[accountType].totalDebit += account.totalDebit;
    grouped[accountType].totalCredit += account.totalCredit;
    grouped[accountType].solde = grouped[accountType].totalDebit - grouped[accountType].totalCredit;
  });
  return grouped;
});
const openSections = ref({});

const isSectionOpen = (type) => {
  return openSections.value[type] !== false; // Ouvert par défaut
};

const toggleSection = (type) => {
  openSections.value = {
    ...openSections.value,
    [type]: !isSectionOpen(type)
  };
};
// Calculer les totaux généraux de la balance
const balanceTotals = computed(() => {
  let totalDebit = 0;
  let totalCredit = 0;
  let totalSolde = 0;

  Object.values(balanceData.value).forEach(account => {
    totalDebit += account.totalDebit;
    totalCredit += account.totalCredit;
    totalSolde = totalDebit - totalCredit;
  });

  return {
    totalDebit,
    totalCredit,
    totalSolde,
  };
});

// Lignes pour le compte sélectionné dans la modale
const accountLines = computed(() => {
  if (!selectedAccount.value) return [];

  const lines = [];

  // Filtrer les journaux
  const filteredJournals = grandLivre.value.filter(journal => {
    let matches = true;
    const journalDate = new Date(journal.DateAcct);
    
    if (dateMin.value) {
      const minDate = new Date(dateMin.value);
      matches = matches && journalDate >= minDate;
    }
    if (dateMax.value) {
      const maxDate = new Date(dateMax.value);
      maxDate.setHours(23, 59, 59, 999);
      matches = matches && journalDate <= maxDate;
    }
    if (referenceFilter.value) {
      const refLower = referenceFilter.value.toLowerCase();
      matches = matches && (
        (journal.Description || '').toLowerCase().includes(refLower) ||
        (journal.DocumentNo || '').toLowerCase().includes(refLower)
      );
    }

    return matches;
  });

  // Extraire les lignes pour le compte sélectionné
  filteredJournals.forEach(journal => {
    (journal.GL_JournalLine || []).forEach(line => {
      if (line.Account_ID?.identifier === selectedAccount.value) {
        lines.push({
          ...line,
          journalDescription: journal.Description || 'N/A',
          DocumentNo: journal.DocumentNo || 'N/A',
          DateAcct: line.DateAcct || journal.DateAcct,
        });
      }
    });
  });

  // Trier par date et Line
  return lines.sort((a, b) => {
    const dateA = new Date(a.DateAcct);
    const dateB = new Date(b.DateAcct);
    return dateA - dateB || a.Line - b.Line;
  });
});

// Calculer les soldes courants pour la modale
const runningBalances = computed(() => {
  let runningBalance = 0;
  return accountLines.value.map(line => {
    runningBalance += (line.AmtAcctDr || 0) - (line.AmtAcctCr || 0);
    return runningBalance;
  });
});

// Calculer les totaux pour la modale
const totalDebit = computed(() => {
  return accountLines.value.reduce((sum, line) => sum + (line.AmtAcctDr || 0), 0);
});

const totalCredit = computed(() => {
  return accountLines.value.reduce((sum, line) => sum + (line.AmtAcctCr || 0), 0);
});

// Créer le graphique
const renderChart = () => {
  if (chartInstance.value) {
    chartInstance.value.destroy();
  }
  
  const ctx = document.getElementById('accountChart')?.getContext('2d');
  if (!ctx || !accountLines.value.length) return;
  
  // Préparer les données pour le graphique
  const labels = accountLines.value.map(line => formatDate(line.DateAcct));
  const debitData = accountLines.value.map(line => line.AmtAcctDr || 0);
  const creditData = accountLines.value.map(line => line.AmtAcctCr || 0);
  const soldeData = runningBalances.value;
  
  chartInstance.value = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Débit',
          data: debitData,
          borderColor: 'rgb(255, 99, 132)',
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          borderWidth: 2,
          tension: 0.1,
          fill: false
        },
        {
          label: 'Crédit',
          data: creditData,
          borderColor: 'rgb(54, 162, 235)',
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          borderWidth: 2,
          tension: 0.1,
          fill: false
        },
        {
          label: 'Solde',
          data: soldeData,
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          borderWidth: 3,
          tension: 0.1,
          fill: false
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: `Évolution du compte: ${selectedAccount.value}`,
          font: {
            size: 16
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              let label = context.dataset.label || '';
              if (label) {
                label += ': ';
              }
              if (context.parsed.y !== null) {
                label += formatCurrency(context.parsed.y);
              }
              return label;
            }
          }
        }
      },
      scales: {
        y: {
          ticks: {
            callback: function(value) {
              return formatCurrency(value);
            }
          }
        }
      },
      animation: {
        duration: 1000,
        easing: 'easeOutQuart'
      }
    }
  });
};

// Observer les changements pour recréer le graphique
watchEffect(() => {
  if (showModal.value && accountLines.value.length) {
    nextTick(() => {
      renderChart();
    });
  }
});

// Charger les données initiales
onMounted(async () => {
  try {
    const grandLivreResponse = await journalService.getGrandLivre();
    const rawResponse = grandLivreResponse || [];
    grandLivre.value = rawResponse;
  } catch (err) {
    error.value = 'Erreur lors du chargement de la Balance';
    console.error('Erreur API:', err.response ? err.response.data : err.message);
  }
});
</script>

<template>
  <div class="row h-100">
    <div class="col-2 bg-light">
      <div class="container mt-3" id="navbarNav">
        <ul class="navbar-nav">
          <li class="nav-item">
            <router-link to="/balance" class="nav-link">Balance</router-link>
          </li>
          <li class="nav-item">
            <router-link to="/grandLivre" class="nav-link">Grand Livre</router-link>
          </li>
          <li class="nav-item">
            <router-link to="/dashboard" class="nav-link">Dashboard</router-link>
          </li>
          <li class="nav-item">
            <router-link to="/import" class="nav-link">Import</router-link>
          </li>
          <li class="nav-item">
            <router-link to="/Ecriture" class="nav-link">Saisie d'écriture</router-link>
          </li>
        </ul>
      </div>
    </div>
    <div class="col-10 p-4">
      <h1>Balance Comptable</h1>
      <div v-if="error" class="error">{{ error }}</div>
      
      <!-- Filtres -->
      <div class="row mb-3">
        <div class="col-md-3">
          <label for="dateMin" class="form-label">Date de début</label>
          <input type="date" class="form-control" id="dateMin" v-model="dateMin">
        </div>
        <div class="col-md-3">
          <label for="dateMax" class="form-label">Date de fin</label>
          <input type="date" class="form-control" id="dateMax" v-model="dateMax">
        </div>
        <div class="col-md-4">
          <label for="referenceFilter" class="form-label">Libellé/Référence</label>
          <input type="text" class="form-control" id="referenceFilter" v-model="referenceFilter" 
                 placeholder="Filtrer par libellé ou référence">
        </div>
        <div class="col-md-2 d-flex align-items-end">
          <button class="btn btn-secondary" @click="resetFilters">Réinitialiser</button>
        </div>
      </div>

<!-- Tableau de la balance -->
<div v-if="Object.keys(groupedBalanceData).length" class="balance-container">
  <div v-for="(group, type) in groupedBalanceData" :key="type" class="balance-section">
    <!-- En-tête de section -->
    <div class="section-header">
      <h3 class="section-title">
        Type - {{ type }}
      </h3>
    </div>

    <!-- Contenu de section (pliable) -->
    <div v-show="isSectionOpen(type)" class="section-content">
      <table class="table table-bordered table-sm account-table">
        <thead class="table-light">
          <tr>
            <th>Compte</th>
            <th>Débit</th>
            <th>Crédit</th>
            <th>Solde</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="account in group.data" :key="account.name" class="account-row">
            <td class="account-name">
              <span class="account-link" @click="openModal(account.name)">
                {{ account.name }}
              </span>
            </td>
            <td>{{ formatCurrency(account.totalDebit) }}</td>
            <td>{{ formatCurrency(account.totalCredit) }}</td>
            <td :class="{'text-danger': account.solde < 0, 'text-success': account.solde >= 0}">
              {{ formatCurrency(account.solde) }}
            </td>
          </tr>
        </tbody>
        <tfoot class="table-secondary">
          <tr>
            <td class="text-end fw-bold">Total - {{ type }}</td>
            <td class="fw-bold">{{ formatCurrency(group.totalDebit) }}</td>
            <td class="fw-bold">{{ formatCurrency(group.totalCredit) }}</td>
            <td class="fw-bold">{{ formatCurrency(group.solde) }}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  </div>

  <!-- Total général -->
  <div class="grand-total">
    <table class="table table-bordered">
      <tfoot class="table-total">
        <tr>
          <td colspan="2" class="text-end fw-bold">TOTAL GÉNÉRAL</td>
          <td class="fw-bold">{{ formatCurrency(balanceTotals.totalDebit) }}</td>
          <td class="fw-bold">{{ formatCurrency(balanceTotals.totalCredit) }}</td>
          <td class="fw-bold">{{ formatCurrency(balanceTotals.totalSolde) }}</td>
        </tr>
      </tfoot>
    </table>
  </div>
</div>

<div v-else class="no-data alert alert-info">
  Aucune donnée disponible pour les filtres sélectionnés.
</div>

      <!-- Modale pour le grand livre du compte -->
      <div v-if="showModal" class="modal-overlay">
        <div class="modal-content">
          <div class="modal-header">
            <h2 class="modal-title">Grand Livre : {{ selectedAccount }}</h2>
            <button @click="closeModal" class="btn-close">
              x
            </button>
          </div>
          <div class="modal-body">
            <!-- Graphique d'évolution -->
            <div class="chart-container">
              <div v-if="!accountLines.length" class="chart-placeholder">
                Chargement des données...
              </div>
              <canvas v-else id="accountChart"></canvas>
            </div>
            
            <table v-if="accountLines.length" class="table table-bordered">
              <thead class="table-light">
                <tr>
                  <th>Date</th>
                  <th>Pièce</th>
                  <th>Libellé</th>
                  <th>Débit</th>
                  <th>Crédit</th>
                  <th>Solde</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(line, index) in accountLines" :key="line.id">
                  <td>{{ formatDate(line.DateAcct) }}</td>
                  <td>{{ line.DocumentNo }}</td>
                  <td>{{ line.journalDescription || 'N/A' }}</td>
                  <td>{{ formatCurrency(line.AmtAcctDr) }}</td>
                  <td>{{ formatCurrency(line.AmtAcctCr) }}</td>
                  <td>{{ formatCurrency(runningBalances[index]) }}</td>
                </tr>
              </tbody>
              <tfoot class="table-total">
                <tr>
                  <td colspan="3" class="text-end fw-bold">Total</td>
                  <td class="fw-bold">{{ formatCurrency(totalDebit) }}</td>
                  <td class="fw-bold">{{ formatCurrency(totalCredit) }}</td>
                  <td class="fw-bold">{{ formatCurrency(totalDebit - totalCredit) }}</td>
                </tr>
              </tfoot>
            </table>
            <div v-else class="no-data alert alert-info">
              Aucune transaction pour ce compte avec les filtres sélectionnés.
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 2rem;
}

th, td {
  padding: 8px;
  text-align: left;
}

th {
  background-color: #f2f2f2;
}

.error {
  color: red;
  margin-bottom: 1rem;
}

.text-right {
  text-align: right;
}

tfoot {
  font-weight: bold;
  background-color: #e0e0e0;
}

.filters {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  flex-direction: column;
}

.filter-group label {
  margin-bottom: 0.2rem;
}

.filter-group input {
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.reset-button {
  padding: 0.5rem 1rem;
  background-color: #f44336;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.reset-button:hover {
  background-color: #d32f2f;
}

.no-data {
  text-align: center;
  color: #666;
  margin-top: 1rem;
}

.account-link {
  color: rgb(3, 57, 3);
  text-decoration: none;
  cursor: pointer;
  font-weight: 700;
}

.account-link:hover {
  text-decoration: underline;
  color: rgba(3, 57, 3, 0.7);
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 20px;
  border-radius: 8px;
  width: 90%;
  max-width: 1200px;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #eee;
}

.modal-title {
  font-size: 1.5rem;
  color: #2c3e50;
}

.btn-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #6c757d;
}

.btn-close:hover {
  color: #2c3e50;
}

.chart-container {
  height: 300px;
  margin-bottom: 25px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  padding: 15px;
}

.chart-placeholder {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  font-style: italic;
  background-color: #f8f9fa;
  border-radius: 4px;
}

.account-type-row {
  background-color: #e9f7fe;
  font-weight: bold;
}

.table-total {
  background-color: #f8f9fa;
  font-weight: bold;
}

@media (max-width: 768px) {
  .modal-content {
    width: 95%;
    padding: 15px;
  }
  
  .chart-container {
    height: 250px;
  }
  
  .modal-title {
    font-size: 1.2rem;
  }
}
</style>