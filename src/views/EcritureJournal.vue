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
            <div class="form-container">
                <h1>Formulaire Comptable</h1>
                <div class="form-group">
                    <label for="compte">Compte <span class="required">*</span></label>
                    <select v-model="form.compte" id="compte" :disabled="loading" @change="clearError('compte')">
                        <option value="" disabled>Sélectionnez un compte</option>
                        <option v-for="compte in comptes" :key="compte.C_ElementValue_ID || compte.id" :value="compte">
                            {{ compte.Value || 'N/A' }} - {{ compte.Name || 'Sans nom' }}
                        </option>
                    </select>
                    <span class="error" v-if="errors.compte">{{ errors.compte }}</span>
                </div>
                <div class="form-group">
                    <label for="date">Date <span class="required">*</span></label>
                    <input v-model="form.date" type="date" id="date" :disabled="loading" @input="clearError('date')">
                    <span class="error" v-if="errors.date">{{ errors.date }}</span>
                </div>
                <div class="form-group">
                    <label for="reference">Référence <span class="required">*</span></label>
                    <input v-model="form.reference" type="text" id="reference" :disabled="loading"
                        @input="clearError('reference')">
                    <span class="error" v-if="errors.reference">{{ errors.reference }}</span>
                </div>
                <div class="form-group">
                    <label for="debit">Débit</label>
                    <input v-model.number="form.debit" type="number" id="debit" step="0.01" min="0" :disabled="loading"
                        @input="clearError('amount')">
                    <span class="error" v-if="errors.amount">{{ errors.amount }}</span>
                </div>
                <div class="form-group">
                    <label for="credit">Crédit</label>
                    <input v-model.number="form.credit" type="number" id="credit" step="0.01" min="0" :disabled="loading"
                        @input="clearError('amount')">
                    <span class="error" v-if="errors.amount">{{ errors.amount }}</span>
                </div>
                <button @click="submitForm" :disabled="loading || !isFormValid">
                    {{ loading ? 'En cours...' : 'Soumettre' }}
                </button>
                <p v-if="successMessage" class="success">{{ successMessage }}</p>
            </div>
        </div>
    </div>
</template>

<script>
import compteService from '@/services/compteService.js';
import journalService from '@/services/journalService.js';
import apiClient from "@/services/api";


export default {
    name: 'SaisieEcriture',
    data() {
        return {
            form: {
                compte: '',
                date: '',
                reference: '',
                debit: 0,
                credit: 0,
            },
            comptes: [],
            loading: false,
            errors: {
                compte: '',
                date: '',
                reference: '',
                amount: '',
            },
            successMessage: '',
        };
    },
    computed: {
        isFormValid() {
            return this.form.compte && this.form.date && this.form.reference && (this.form.debit > 0 || this.form.credit > 0);
        },
    },
    async created() {
        await this.fetchComptes();
    },
    methods: {
        async journalExist(value) {
            try {
                const response = await apiClient.get(`/models/GL_Journal?$filter=Description eq '${value}' AND IsActive eq true`);
                return response.records || [];
            } catch (error) {
                console.error('Erreur lors de la vérification du journal :', error);
                return [];
            }
        },
        async fetchComptes() {
            try {
                this.loading = true;
                const comptes = await compteService.getAllComptes();
                console.log('Comptes récupérés :', comptes);
                this.comptes = comptes;
                if (this.comptes.length === 0) {
                    this.errors.compte = 'Aucun compte valide trouvé. Vérifiez les comptes dans iDempiere.';
                    console.warn('Aucun compte chargé. Vérifiez la configuration iDempiere.');
                }
            } catch (error) {
                console.error('Erreur lors de la récupération des comptes :', {
                    message: error.message,
                    stack: error.stack,
                });
                this.errors.compte = 'Erreur lors du chargement des comptes. Vérifiez la connexion à l\'API iDempiere.';
            } finally {
                this.loading = false;
            }
        },
        async validateForm() {
            this.errors = { compte: '', date: '', reference: '', amount: '' };
            let isValid = true;

            if (!this.form.compte) {
                this.errors.compte = 'Veuillez sélectionner un compte.';
                isValid = false;
            }
            if (!this.form.date) {
                this.errors.date = 'Veuillez sélectionner une date.';
                isValid = false;
            }
            if (!this.form.reference) {
                this.errors.reference = 'Veuillez entrer une référence.';
                isValid = false;
            // } else {
            //     // Vérification de l'existence de la référence
            //     const existingJournals = await this.journalExist(this.form.reference);
            //     if (existingJournals.length > 0) {
            //         this.errors.reference = 'Un journal avec cette référence existe déjà.';
            //         isValid = false;
            //     }
            }
            if (this.form.debit === 0 && this.form.credit === 0) {
                this.errors.amount = 'Veuillez entrer un débit ou un crédit.';
                isValid = false;
            }
            if (this.form.debit > 0 && this.form.credit > 0) {
                this.errors.amount = 'Veuillez entrer soit un débit, soit un crédit, pas les deux.';
                isValid = false;
            }
            if (this.form.debit < 0 || this.form.credit < 0) {
                this.errors.amount = 'Les montants ne peuvent pas être négatifs.';
                isValid = false;
            }
            if (!Number.isFinite(this.form.debit) || !Number.isFinite(this.form.credit)) {
                this.errors.amount = 'Veuillez entrer des montants valides.';
                isValid = false;
            }

            return isValid;
        },
        clearError(field) {
            this.errors[field] = '';
            this.successMessage = '';
        },
        async submitForm() {
            const isValid = await this.validateForm();
            if (!isValid) {
                return;
            }

            this.loading = true;
            this.successMessage = '';
            try {
                // Créer le journal
                const journalData = {
                    date: this.form.date,
                    reference: this.form.reference,
                };
                let journal
                const existingJournals = await this.journalExist(this.form.reference);
                if (existingJournals.length > 0) {
                    journal=existingJournals[0]
                    console.log(journal)
                }else{
                const journalResponse = await journalService.createJournal(journalData);
                    journal=journalResponse
                    console.log(journal)
                }

                // Créer la ligne de journal
                const journalLineData = {
                    date: this.form.date,
                    debit: Number(this.form.debit) || 0,
                    credit: Number(this.form.credit) || 0,
                };
                console.log(journalLineData);
                const compte = {
                    id: this.form.compte.C_ElementValue_ID || this.form.compte.id,
                };
                await journalService.createJournalLine1(journalLineData, journal, compte, 10);

                this.successMessage = 'Écriture comptable créée avec succès !';
                this.form = { compte: '', date: '', reference: '', debit: 0, credit: 0 };
            } catch (error) {
                console.error('Erreur lors de la soumission :', {
                    message: error.message,
                    response: error.response ? error.response.data : null,
                });
                this.errors.amount = error.message.includes('Aucune période active')
                    ? 'Aucune période comptable active pour la date sélectionnée.'
                    : `Échec de la création de l'écriture : ${error.message}`;
            } finally {
                this.loading = false;
            }
        },
    },
};
</script>
<style scoped>

</style>
