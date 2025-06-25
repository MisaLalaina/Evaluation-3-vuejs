<script setup>
import { ref, computed, onMounted } from 'vue'
import compteService from '@/services/compteService'

// États réactifs
const comptes = ref([]) // liste donnees existants

const nouveauCompte = ref('') // variable pour nouveau compte
const nouveauLibelle = ref('') // variable pour nouveau libelle
const nouveauType = ref('A') // variable pour nouveau type

const chargement = ref(false)
const messageSucces = ref('')
const messageErreur = ref('')
const recherche = ref('')
const triChamp = ref('Value')
const triOrdre = ref('asc')
const pageCourante = ref(1)
const elementsParPage = ref(10)

// Computed properties
const comptesTries = computed(() => {
  return [...comptes.value].sort((a, b) => {
    const modifier = triOrdre.value === 'asc' ? 1 : -1
    const champ = triChamp.value
    
    if (a[champ] < b[champ]) return -1 * modifier
    if (a[champ] > b[champ]) return 1 * modifier
    return 0
  })
})

const comptesFiltres = computed(() => {
  const rechercheLower = recherche.value.toLowerCase()
  return comptesTries.value.filter(compte => {
    return (
      compte.Value.toLowerCase().includes(rechercheLower) ||
      compte.Name.toLowerCase().includes(rechercheLower) ||
      getTypeLabel(compte.AccountType).toLowerCase().includes(rechercheLower)
    )
  })
})

const totalPages = computed(() => {
  return Math.ceil(comptesFiltres.value.length / elementsParPage.value)
})

const comptesPagination = computed(() => {
  const start = (pageCourante.value - 1) * elementsParPage.value
  const end = start + elementsParPage.value
  return comptesFiltres.value.slice(start, end)
})

// Méthodes
const chargerComptes = async () => {
  try {
    chargement.value = true
    const data = await compteService.getAllComptes()
    comptes.value = data
    chargement.value = false
  } catch (error) {
    console.error("Erreur lors du chargement des comptes:", error)
    messageErreur.value = "Erreur lors du chargement des comptes"
    setTimeout(() => messageErreur.value = '', 3000)
    chargement.value = false
  }
}

const creerCompte = async () => {
    // Verification de donnees
  if (!nouveauCompte.value || !nouveauLibelle.value) {
    messageErreur.value = "Veuillez remplir tous les champs obligatoires"
    setTimeout(() => messageErreur.value = '', 3000)
    return
  }

  try {
    chargement.value = true
    // Contrainte existance
    const existeDeja = await compteService.compteExist(nouveauCompte.value)
    
    if (existeDeja) {
      messageErreur.value = `Le compte ${nouveauCompte.value} existe déjà`
      setTimeout(() => messageErreur.value = '', 3000)
      chargement.value = false
      return
    }

    const compteData = {
      Value: nouveauCompte.value,
      Name: nouveauLibelle.value,
      AccountType: nouveauType.value,
      IsActive: true
    }

    await compteService.createCompte(compteData)
    messageSucces.value = `Compte ${nouveauCompte.value} créé avec succès!`
    
    // Réinitialisation du formulaire
    nouveauCompte.value = ''
    nouveauLibelle.value = ''
    nouveauType.value = 'A'
    
    // Rechargement des comptes
    await chargerComptes()
    
    setTimeout(() => messageSucces.value = '', 3000)
  } catch (error) {
    console.error("Erreur lors de la création du compte:", error)
    messageErreur.value = `Erreur lors de la création du compte: ${error.message}`
    setTimeout(() => messageErreur.value = '', 5000)
  } finally {
    chargement.value = false
  }
}

const getTypeLabel = (type) => {
  const types = {
    'A': 'Actif',
    'P': 'Passif',
    'E': 'Dépense',
    'R': 'Recette',
    'O': 'Autre'
  }
  return types[type] || type
}

const getTypeClass = (type) => {
  return `type-${type.toLowerCase()}`
}

const trierPar = (champ) => {
  if (triChamp.value === champ) {
    triOrdre.value = triOrdre.value === 'asc' ? 'desc' : 'asc'
  } else {
    triChamp.value = champ
    triOrdre.value = 'asc'
  }
}

const pagePrecedente = () => {
  if (pageCourante.value > 1) pageCourante.value--
}

const pageSuivante = () => {
  if (pageCourante.value < totalPages.value) pageCourante.value++
}

const toggleStatusCompte = (compte) => {
  try {
    const nouveauStatut = !compte.IsActive
    messageSucces.value = `Compte ${compte.Value} ${nouveauStatut ? 'activé' : 'désactivé'} avec succès`
    compte.IsActive = nouveauStatut
    setTimeout(() => messageSucces.value = '', 3000)
  } catch (error) {
    messageErreur.value = `Erreur lors de la modification du statut: ${error.message}`
    setTimeout(() => messageErreur.value = '', 5000)
  }
}

const editerCompte = (compte) => {
  messageSucces.value = `Édition du compte ${compte.Value} - Cette fonctionnalité sera implémentée prochainement`
  setTimeout(() => messageSucces.value = '', 3000)
}

// Lifecycle hook
onMounted(() => {
  chargerComptes()
})
</script>
<template>
  <div class="compte-list-container">
    
    <div class="header">
      <h1>Gestion des Comptes Comptables</h1>
      <p>Créez et gérez votre plan comptable</p>
    </div>

    <div class="compte-form">
      <h2>Créer un nouveau compte</h2>
      <div class="form-row">
        <div class="form-group">
          <label for="compte">Numéro de compte *</label>
          <input type="text" id="compte" v-model="nouveauCompte" placeholder="Ex: 512000" required>
        </div>
        <div class="form-group">
          <label for="libelle">Libellé du compte *</label>
          <input type="text" id="libelle" v-model="nouveauLibelle" placeholder="Ex: Banque ABC" required>
        </div>
        <div class="form-group">
          <label for="accountType">Type de compte *</label>
          <select id="accountType" v-model="nouveauType">
            <option value="A">Actif (A)</option>
            <option value="P">Passif (P)</option>
            <option value="E">Dépense (E)</option>
            <option value="R">Recette (R)</option>
            <option value="O">Autre (O)</option>
          </select>
        </div>
        <div class="form-group">
          <button class="btn-create" @click="creerCompte" :disabled="chargement">
            <span v-if="!chargement">Créer le compte</span>
            <span v-else>Création en cours...</span>
          </button>
        </div>
      </div>
    </div>

    <div class="status-message" :class="{'success': messageSucces, 'error': messageErreur}">
      <div v-if="messageSucces">{{ messageSucces }}</div>
      <div v-if="messageErreur">{{ messageErreur }}</div>
    </div>

    <div class="compte-list">
      <div class="list-header">
        <h2>Liste des comptes</h2>
        <div class="search-box">
          <input type="text" v-model="recherche" placeholder="Rechercher un compte...">
          <span class="search-icon">🔍</span>
        </div>
      </div>

      <div class="table-responsive">
        <table class="compte-table">
          <thead>
            <tr>
              <th @click="trierPar('Value')" :class="{ active: triChamp === 'Value' }">
                Numéro de compte
                <span v-if="triChamp === 'Value'">{{ triOrdre === 'asc' ? '↑' : '↓' }}</span>
              </th>
              <th @click="trierPar('Name')" :class="{ active: triChamp === 'Name' }">
                Libellé
                <span v-if="triChamp === 'Name'">{{ triOrdre === 'asc' ? '↑' : '↓' }}</span>
              </th>
              <th @click="trierPar('AccountType')" :class="{ active: triChamp === 'AccountType' }">
                Type
                <span v-if="triChamp === 'AccountType'">{{ triOrdre === 'asc' ? '↑' : '↓' }}</span>
              </th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="comptesFiltres.length === 0">
              <td colspan="5" class="no-data">Aucun compte trouvé</td>
            </tr>
            <tr v-for="compte in comptesFiltres" :key="compte.C_ElementValue_ID">
              <td>{{ compte.Value }}</td>
              <td>{{ compte.Name }}</td>
              <td>
                <span class="account-type" :class="getTypeClass(compte.AccountType.id)">
                  {{ getTypeLabel(compte.AccountType.id) }}
                </span>
              </td>
              <td>
                <span class="status-badge" :class="compte.IsActive ? 'active' : 'inactive'">
                  {{ compte.IsActive ? 'Actif' : 'Inactif' }}
                </span>
              </td>
              <td class="actions">
                <button class="btn-edit" @click="editerCompte(compte)">✏️</button>
                <button 
                  class="btn-toggle" 
                  @click="toggleStatusCompte(compte)"
                  :class="compte.IsActive ? 'deactivate' : 'activate'"
                >
                  {{ compte.IsActive ? 'Désactiver' : 'Activer' }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="pagination" v-if="comptesFiltres.length > 0">
        <button @click="pagePrecedente" :disabled="pageCourante === 1">← Précédent</button>
        <span>Page {{ pageCourante }} sur {{ totalPages }}</span>
        <button @click="pageSuivante" :disabled="pageCourante === totalPages">Suivant →</button>
      </div>
    </div>
  </div>
</template>
<style scoped>
.compte-list-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  color: #333;
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
}

.compte-form {
  background-color: #f8f9fa;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 30px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
}

.compte-form h2 {
  color: #2c3e50;
  margin-top: 0;
  margin-bottom: 20px;
  font-size: 1.4rem;
}

.form-row {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  align-items: flex-end;
}

.form-group {
  flex: 1;
  min-width: 200px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
  color: #495057;
}

.form-group input, .form-group select {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 16px;
  transition: border-color 0.2s;
}

.form-group input:focus, .form-group select:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
}

.btn-create {
  background-color: #3498db;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  font-size: 16px;
  transition: background-color 0.2s;
  width: 100%;
}

.btn-create:hover {
  background-color: #2980b9;
}

.btn-create:disabled {
  background-color: #bdc3c7;
  cursor: not-allowed;
}

.status-message {
  padding: 15px;
  margin-bottom: 20px;
  border-radius: 4px;
  font-weight: 500;
}

.status-message.success {
  background-color: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.status-message.error {
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.compte-list {
  background-color: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 15px rgba(0,0,0,0.08);
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 15px;
}

.search-box {
  position: relative;
  min-width: 250px;
}

.search-box input {
  width: 100%;
  padding: 10px 12px 10px 35px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 16px;
}

.search-icon {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: #6c757d;
}

.table-responsive {
  overflow-x: auto;
}

.compte-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 15px;
}

.compte-table th {
  background-color: #f1f5f9;
  padding: 12px 15px;
  text-align: left;
  font-weight: 600;
  color: #2c3e50;
  cursor: pointer;
  border-bottom: 2px solid #e2e8f0;
}

.compte-table th.active {
  background-color: #e3f2fd;
}

.compte-table th span {
  margin-left: 5px;
}

.compte-table td {
  padding: 12px 15px;
  border-bottom: 1px solid #e2e8f0;
}

.compte-table tr:hover td {
  background-color: #f8fafc;
}

.account-type {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 500;
}

.type-a {
  background-color: #e3f2fd;
  color: #1976d2;
}

.type-p {
  background-color: #f3e5f5;
  color: #9c27b0;
}

.type-e {
  background-color: #ffebee;
  color: #d32f2f;
}

.type-r {
  background-color: #e8f5e9;
  color: #388e3c;
}

.type-o {
  background-color: #fff3e0;
  color: #f57c00;
}

.status-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 500;
}

.status-badge.active {
  background-color: #e8f5e9;
  color: #388e3c;
}

.status-badge.inactive {
  background-color: #ffebee;
  color: #d32f2f;
}

.actions {
  display: flex;
  gap: 8px;
}

.btn-edit, .btn-toggle {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.btn-edit {
  background-color: #e0e0e0;
  color: #333;
}

.btn-edit:hover {
  background-color: #d0d0d0;
}

.btn-toggle {
  color: white;
}

.btn-toggle.activate {
  background-color: #4caf50;
}

.btn-toggle.activate:hover {
  background-color: #43a047;
}

.btn-toggle.deactivate {
  background-color: #f44336;
}

.btn-toggle.deactivate:hover {
  background-color: #e53935;
}

.no-data {
  text-align: center;
  padding: 20px;
  color: #6c757d;
  font-style: italic;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 15px;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #e2e8f0;
}

.pagination button {
  padding: 8px 16px;
  background-color: #3498db;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.pagination button:hover {
  background-color: #2980b9;
}

.pagination button:disabled {
  background-color: #bdc3c7;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .form-row {
    flex-direction: column;
    align-items: stretch;
  }
  
  .list-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .search-box {
    width: 100%;
  }
  
  .actions {
    flex-direction: column;
  }
}
</style>