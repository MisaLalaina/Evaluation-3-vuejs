<template>
  <div>
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
        <li class="nav-item">
          <router-link to="/journl" class="nav-link">Liste de journal</router-link>
        </li>
      </ul>
    </div>

    <div class="journal-list-container">
      <h2>Liste des Écritures Comptables</h2>
      
      <div class="controls">
        <button @click="refreshList" class="btn-refresh">
          <i class="fas fa-sync-alt"></i> Actualiser
        </button>
      </div>

      <div class="table-responsive">
        <table class="journal-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Date</th>
              <th>Référence</th>
              <th>Statut</th>
              <th>Total Débit</th>
              <th>Total Crédit</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="journal in journals" :key="journal.id">
              <td>{{ journal.id }}</td>
              <td>{{ formatDate(journal.DateAcct) }}</td>
              <td>{{ journal.Description }}</td>
              <td :class="getStatusClass(journal.DocStatus)">
                {{ getStatusText(journal.DocStatus) }}
              </td>
              <td class="debit">{{ formatAmount(calculateTotalDebit(journal)) }}</td>
              <td class="credit">{{ formatAmount(calculateTotalCredit(journal)) }}</td>
              <td class="actions">
                <button 
                  @click="editJournal(journal.id)" 
                  class="btn-edit"
                  :disabled="journal.DocStatus !== 'DR'"
                >
                  <i class="fas fa-edit"></i> Modifier
                </button>
                <button 
                  @click="confirmDelete(journal.id)" 
                  class="btn-delete"
                  :disabled="!canDelete(journal)"
                >
                  <i class="fas fa-trash"></i> Supprimer
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Confirmation de suppression -->
      <div v-if="showDeleteModal" class="modal">
        <div class="modal-content">
          <h3>Confirmer la suppression</h3>
          <p>Êtes-vous sûr de vouloir supprimer ce journal (ID: {{ journalToDelete }}) ?</p>
          <div class="modal-actions">
            <button @click="deleteJournal" class="btn-confirm-delete">Confirmer</button>
            <button @click="cancelDelete" class="btn-cancel">Annuler</button>
          </div>
        </div>
      </div>

      <div v-if="loading" class="loading-spinner">
        <i class="fas fa-spinner fa-spin"></i> Chargement en cours...
      </div>
      <div v-if="error" class="error-message">
        <i class="fas fa-exclamation-triangle"></i> {{ error }}
      </div>
    </div>
  </div>
</template>

<script>
import journalService from '@/services/journalService';

export default {
  name: 'JournalListe',
  data() {
    return {
      journals: [],
      loading: false,
      error: null,
      showDeleteModal: false,
      journalToDelete: null
    };
  },
  created() {
    this.fetchJournals();
  },
  methods: {
    async fetchJournals() {
      this.loading = true;
      this.error = null;
      try {
        const response = await journalService.getGrandLivre();
        this.journals = response || [];
      } catch (err) {
        console.error('Erreur lors du chargement des journaux:', err);
        this.error = 'Impossible de charger la liste des journaux. Veuillez réessayer.';
      } finally {
        this.loading = false;
      }
    },
    refreshList() {
      this.fetchJournals();
    },
    formatDate(dateString) {
      if (!dateString) return 'N/A';
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR');
    },
    formatAmount(amount) {
      return amount ? new Intl.NumberFormat('fr-FR', { 
        style: 'currency', 
        currency: 'EUR' 
      }).format(amount) : '-';
    },
    getStatusText(status) {
      const statusMap = {
        'DR': 'Brouillon',
        'CO': 'Complété',
        'VO': 'Annulé',
        'RE': 'Rejeté'
      };
      return statusMap[status] || status;
    },
    getStatusClass(status) {
      const classMap = {
        'DR': 'status-draft',
        'CO': 'status-completed',
        'VO': 'status-voided',
        'RE': 'status-rejected'
      };
      return classMap[status] || '';
    },
    calculateTotalDebit(journal) {
      if (!journal.GL_JournalLine) return 0;
      return journal.GL_JournalLine.reduce((sum, line) => sum + (line.AmtAcctDr || 0), 0);
    },
    calculateTotalCredit(journal) {
      if (!journal.GL_JournalLine) return 0;
      return journal.GL_JournalLine.reduce((sum, line) => sum + (line.AmtAcctCr || 0), 0);
    },
    canDelete(journal) {
      return journal.DocStatus === 'DR' && (!journal.GL_JournalLine || journal.GL_JournalLine.length === 0);
    },
    editJournal(journalId) {
      this.$router.push({ name: 'EditJournal', params: { id: journalId } });
    },
    confirmDelete(journalId) {
      this.journalToDelete = journalId;
      this.showDeleteModal = true;
    },
    cancelDelete() {
      this.journalToDelete = null;
      this.showDeleteModal = false;
    },
    async deleteJournal() {
      if (!this.journalToDelete) return;
      
      try {
        this.loading = true;
        await journalService.deleteJournal(this.journalToDelete);
        this.$toast.success('Journal supprimé avec succès');
        this.fetchJournals();
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        this.$toast.error('Échec de la suppression du journal: ' + error.message);
      } finally {
        this.loading = false;
        this.showDeleteModal = false;
        this.journalToDelete = null;
      }
    }
  }
};
</script>

<style scoped>
.container {
  padding: 0;
}

.navbar-nav {
  display: flex;
  flex-wrap: wrap;
  padding-left: 0;
  margin-bottom: 0;
  list-style: none;
}

.nav-item {
  margin-right: 10px;
}

.nav-link {
  color: #333;
  text-decoration: none;
  padding: 8px 15px;
  border-radius: 4px;
  transition: background-color 0.3s;
}

.nav-link:hover {
  background-color: #f0f0f0;
}

.router-link-exact-active {
  background-color: #dce3de;
  color: white;
}

.journal-list-container {
  padding: 20px;
  max-width: 1200px;
  margin: 20px auto;
}

h2 {
  color: #2c3e50;
  margin-bottom: 20px;
  text-align: center;
}

.controls {
  margin-bottom: 20px;
  text-align: right;
}

.btn-refresh {
  background-color: #6c757d;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.btn-refresh:hover {
  background-color: #5a6268;
}

.journal-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.journal-table th, 
.journal-table td {
  padding: 12px 15px;
  text-align: left;
  border-bottom: 1px solid #e0e0e0;
}

.journal-table th {
  background-color: #c6cac7;
  color: white;
  font-weight: 500;
}

.journal-table tr:hover {
  background-color: #f5f5f5;
}

.actions {
  display: flex;
  gap: 8px;
}

.btn-edit, .btn-delete {
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 0.9rem;
}

.btn-edit {
  background-color: #ffc107;
  color: #212529;
}

.btn-edit:hover:not(:disabled) {
  background-color: #e0a800;
}

.btn-delete {
  background-color: #dc3545;
  color: white;
}

.btn-delete:hover:not(:disabled) {
  background-color: #c82333;
}

.btn-edit:disabled, .btn-delete:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.debit {
  color: #dc3545;
  font-weight: 500;
}

.credit {
  color: #28a745;
  font-weight: 500;
}

.status-draft {
  color: #6c757d;
  font-weight: 500;
}

.status-completed {
  color: #28a745;
  font-weight: 500;
}

.status-voided {
  color: #dc3545;
  font-weight: 500;
}

.status-rejected {
  color: #ffc107;
  font-weight: 500;
}

.loading-spinner {
  text-align: center;
  padding: 20px;
  color: #6c757d;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
}

.error-message {
  color: #dc3545;
  text-align: center;
  padding: 20px;
  background-color: #f8d7da;
  border-radius: 4px;
  margin-top: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
}

.table-responsive {
  overflow-x: auto;
}

/* Modal Styles */
.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0,0,0,0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  width: 400px;
  max-width: 90%;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

.btn-confirm-delete {
  background-color: #dc3545;
  color: white;
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.btn-cancel {
  background-color: #6c757d;
  color: white;
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

@media (max-width: 768px) {
  .navbar-nav {
    flex-direction: column;
  }
  
  .nav-item {
    margin-right: 0;
    margin-bottom: 5px;
  }
  
  .journal-table th, 
  .journal-table td {
    padding: 8px 10px;
  }
  
  .actions {
    flex-direction: column;
  }
  
  .btn-edit, .btn-delete {
    width: 100%;
    justify-content: center;
  }
}
</style>