<script setup>
import { ref, computed, onMounted, nextTick, watchEffect } from 'vue';
import journalService from '@/services/journalService.js';

// États réactifs
const ecritures = ref([])
const chargement = ref(false)
const messageErreur = ref('')

// Méthodes
const chargerEcritures = async () => {
  try {
    chargement.value = true
    messageErreur.value = ''
    const data = await journalService.getGrandLivre()
    ecritures.value = data.map(ecriture => {
      // Calculer le total débit et crédit
      const totalDebit = ecriture.GL_JournalLine.reduce((sum, ligne) => sum + parseFloat(ligne.AmtAcctDr || 0), 0)
      const totalCredit = ecriture.GL_JournalLine.reduce((sum, ligne) => sum + parseFloat(ligne.AmtAcctCr || 0), 0)
      
      return {
        ...ecriture,
        totalDebit,
        totalCredit
      }
    })
  } catch (error) {
    console.error("Erreur lors du chargement des écritures:", error)
    messageErreur.value = "Erreur lors du chargement des écritures: " + error.message
  } finally {
    chargement.value = false
  }
}

const formatDate = (dateString) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

const formatCurrency = (value) => {
  if (value === null || value === undefined) return '-'
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value)
}

// Charger les écritures au montage du composant
onMounted(() => {
  chargerEcritures()
})
</script>


<template>
  <div class="ecriture-list-container">
    <div class="header">
      <h1>Journal des Écritures Comptables</h1>
      <p>Liste complète des écritures et de leurs lignes comptables</p>
    </div>

    <div class="controls">
      <button @click="chargerEcritures" :disabled="chargement" class="btn-refresh">
        {{ chargement ? 'Chargement...' : 'Actualiser la liste' }}
      </button>
    </div>

    <div v-if="messageErreur" class="error-message">
      {{ messageErreur }}
    </div>

    <div v-if="chargement" class="loading-indicator">
      Chargement des écritures en cours...
    </div>

    <div v-else>
      <div v-if="ecritures.length === 0" class="empty-list">
        Aucune écriture comptable trouvée
      </div>

      <div v-else class="ecriture-list">
        <div v-for="ecriture in ecritures" :key="ecriture.id" class="ecriture-card">
          <div class="ecriture-header">
            <div class="ecriture-info">
              <div class="info-item">
                <strong>N° Journal:</strong> {{ ecriture.DocumentNo }}
              </div>
              <div class="info-item">
                <strong>Date:</strong> {{ formatDate(ecriture.DateDoc) }}
              </div>
              <div class="info-item">
                <strong>Référence:</strong> {{ ecriture.Description }}
              </div>
            </div>
            <div class="ecriture-info">
              <div class="info-item">
                <strong>Statut:</strong> 
                <span :class="ecriture.DocStatus === 'CO' ? 'status-completed' : 'status-draft'">
                  {{ ecriture.DocStatus === 'CO' ? 'Comptabilisé' : 'Brouillon' }}
                </span>
              </div>
              <div class="info-item">
                <strong>Total Débit:</strong> {{ formatCurrency(ecriture.totalDebit) }}
              </div>
              <div class="info-item">
                <strong>Total Crédit:</strong> {{ formatCurrency(ecriture.totalCredit) }}
              </div>
            </div>
          </div>

          <div class="lignes-container">
            <table class="lignes-table">
              <thead>
                <tr>
                  <th>Compte</th>
                  <th>Libellé</th>
                  <th>Débit</th>
                  <th>Crédit</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="ligne in ecriture.GL_JournalLine" :key="ligne.id">
                  <td>{{ ligne.Account_ID.Value }}</td>
                  <td>{{ ligne.Description || '-' }}</td>
                  <td class="text-right">{{ formatCurrency(ligne.AmtAcctDr) }}</td>
                  <td class="text-right">{{ formatCurrency(ligne.AmtAcctCr) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>


<style scoped>
.ecriture-list-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.header {
  text-align: center;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #e0e0e0;
}

.header h1 {
  color: #2c3e50;
  margin-bottom: 10px;
  font-size: 2rem;
}

.controls {
  margin-bottom: 20px;
  display: flex;
  justify-content: flex-end;
}

.btn-refresh {
  background-color: #3498db;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s;
}

.btn-refresh:hover {
  background-color: #2980b9;
}

.btn-refresh:disabled {
  background-color: #bdc3c7;
  cursor: not-allowed;
}

.error-message {
  padding: 15px;
  background-color: #f8d7da;
  color: #721c24;
  border-radius: 4px;
  margin-bottom: 20px;
  text-align: center;
}

.loading-indicator {
  padding: 20px;
  text-align: center;
  color: #3498db;
  font-style: italic;
}

.empty-list {
  padding: 30px;
  text-align: center;
  background-color: #f8f9fa;
  border-radius: 4px;
  border: 1px dashed #dee2e6;
  color: #6c757d;
}

.ecriture-list {
  display: flex;
  flex-direction: column;
  gap: 25px;
}

.ecriture-card {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  border: 1px solid #e2e8f0;
  overflow: hidden;
}

.ecriture-header {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  padding: 20px;
  background-color: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}

.ecriture-info {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 300px;
}

.info-item {
  display: flex;
  gap: 5px;
}

.info-item strong {
  min-width: 100px;
}

.status-completed {
  color: #38a169;
  font-weight: 500;
}

.status-draft {
  color: #e53e3e;
  font-weight: 500;
}

.lignes-container {
  overflow-x: auto;
}

.lignes-table {
  width: 100%;
  border-collapse: collapse;
}

.lignes-table th {
  background-color: #edf2f7;
  padding: 12px 15px;
  text-align: left;
  font-weight: 600;
  color: #2d3748;
  border-bottom: 2px solid #cbd5e0;
}

.lignes-table td {
  padding: 12px 15px;
  border-bottom: 1px solid #e2e8f0;
  color: #4a5568;
}

.lignes-table tr:last-child td {
  border-bottom: none;
}

.lignes-table tbody tr:nth-child(even) {
  background-color: #f8fafc;
}

.text-right {
  text-align: right;
}

@media (max-width: 768px) {
  .ecriture-header {
    flex-direction: column;
    gap: 15px;
  }
  
  .ecriture-info {
    min-width: 100%;
  }
  
  .lignes-table {
    font-size: 0.9rem;
  }
  
  .lignes-table th, .lignes-table td {
    padding: 8px 10px;
  }
}
</style>