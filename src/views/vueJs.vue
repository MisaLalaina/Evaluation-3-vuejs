<template>
    <div>
      <h1>Gestion des Comptes</h1>
  
      <!-- Formulaire de création/mise à jour -->
      <form @submit.prevent="handleSubmit">
        <div>
          <label>Numéro de compte:</label>
          <input v-model="formData.compte" required />
        </div>
        <div>
          <label>Libellé:</label>
          <input v-model="formData.libelle" required />
        </div>
        <button type="submit">{{ isEditMode ? 'Mettre à jour' : 'Créer' }}</button>
        <button v-if="isEditMode" @click="cancelEdit">Annuler</button>
      </form>
  
      <!-- Liste des comptes -->
      <table>
        <thead>
          <tr>
            <th>Numéro</th>
            <th>Libellé</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="compte in comptes" :key="compte.C_ElementValue_ID">
            <td>{{ compte.Value }}</td>
            <td>{{ compte.Name }}</td>
            <td>
              <button @click="editCompte(compte)">Modifier</button>
              <button @click="deleteCompte(compte.C_ElementValue_ID)">Supprimer</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </template>
  
  <script>
  import api from "@/api/compteApi";
  
  export default {
    data() {
      return {
        formData: {
          compte: "",
          libelle: "",
          existeDeja: false,
        },
        comptes: [],
        isEditMode: false,
        currentCompteId: null,
      };
    },
    async created() {
      await this.fetchComptes();
    },
    methods: {
      async fetchComptes() {
        try {
          const response = await api.getCompteById(""); // Modifier pour récupérer tous les comptes
          this.comptes = response.records || [];
        } catch (error) {
          console.error("Erreur lors de la récupération des comptes:", error);
        }
      },
      async handleSubmit() {
        try {
          if (this.isEditMode) {
            await api.updateCompte(this.currentCompteId, {
              Name: this.formData.libelle,
              Value: this.formData.compte,
            });
            this.$toast.success("Compte mis à jour avec succès");
          } else {
            const exists = await api.compteExist(this.formData.compte);
            if (exists) {
              this.formData.existeDeja = true;
              this.$toast.warning("Ce compte existe déjà");
              return;
            }
            await api.createCompte(this.formData);
            this.$toast.success("Compte créé avec succès");
          }
          this.resetForm();
          await this.fetchComptes();
        } catch (error) {
          this.$toast.error(`Erreur: ${error.message}`);
        }
      },
      editCompte(compte) {
        this.formData = {
          compte: compte.Value,
          libelle: compte.Name,
          existeDeja: true,
        };
        this.isEditMode = true;
        this.currentCompteId = compte.C_ElementValue_ID;
      },
      cancelEdit() {
        this.resetForm();
      },
      async deleteCompte(id) {
        if (confirm("Êtes-vous sûr de vouloir supprimer ce compte?")) {
          try {
            await api.deleteCompte(id);
            this.$toast.success("Compte supprimé avec succès");
            await this.fetchComptes();
          } catch (error) {
            this.$toast.error(`Erreur lors de la suppression: ${error.message}`);
          }
        }
      },
      resetForm() {
        this.formData = {
          compte: "",
          libelle: "",
          existeDeja: false,
        };
        this.isEditMode = false;
        this.currentCompteId = null;
      },
    },
  };
  </script>
  
  <style scoped>
  /* Ajoutez vos styles CSS ici */
  table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 20px;
  }
  th, td {
    border: 1px solid #ddd;
    padding: 8px;
    text-align: left;
  }
  th {
    background-color: #f2f2f2;
  }
  form div {
    margin-bottom: 10px;
  }
  label {
    display: inline-block;
    width: 120px;
  }
  button {
    margin-right: 5px;
  }
  </style>