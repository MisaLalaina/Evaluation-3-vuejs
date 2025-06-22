<template>
    <h1>Saisie Écriture Comptable</h1>
    <form @submit.prevent="traiterCreation">
        <div class="groupe-formulaire">
            <label for="compte">Compte *</label>
            <select name="compte" id="compte" v-model="compte" required>
                <option disabled value="">Sélectionnez un compte</option>
                <option v-for="compte in comptes" :key="compte.id" :value="compte">
                    {{ compte.Value }}
                </option>
            </select>
        </div>

        <div class="groupe-formulaire">
            <label for="journal">Journal *</label>
            <select name="journal" id="journal" v-model="journal" required>
                <option disabled value="">Sélectionnez un journal</option>
                <option v-for="journal in journals" :key="journal.id" :value="journal">
                    {{ journal.Description }}
                </option>
            </select>
        </div>

        <div class="groupe-formulaire">
            <label for="date">Date *</label>
            <input type="date" v-model="date" required />
        </div>

        <div class="groupe-formulaire">
            <label for="debit">Débit</label>
            <input type="number" v-model.number="debit" min="0" step="0.01" />
        </div>

        <div class="groupe-formulaire">
            <label for="credit">Crédit</label>
            <input type="number" v-model.number="credit" min="0" step="0.01" />
        </div>

        <button type="submit" :disabled="enCoursEnvoi">
            {{ enCoursEnvoi ? 'Enregistrement en cours...' : 'Enregistrer' }}
        </button>
        
        <div v-if="messageErreur" class="message-erreur">{{ messageErreur }}</div>
        <div v-if="messageSucces" class="message-succes">{{ messageSucces }}</div>
    </form>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import journalService from '@/services/journalService.js';
import compteService from '@/services/compteService.js';

// Références réactives
const journals = ref([]);
const comptes = ref([]);
const compte = ref(null);
const journal = ref(null);
const debit = ref(0);
const date = ref(new Date().toISOString().split('T')[0]); // Date du jour par défaut
const credit = ref(0);
const enCoursEnvoi = ref(false);
const messageErreur = ref('');
const messageSucces = ref('');

// Formater la date pour PostgreSQL
function formaterDatePourPostgres(dateStr) {
    // Le champ date HTML fournit déjà le format YYYY-MM-DD
    return `${dateStr} 00:00:00`;
}

// Validation du formulaire
const validerFormulaire = () => {
    if (!compte.value || !journal.value || !date.value) {
        return 'Tous les champs marqués d\'un * sont obligatoires';
    }
    
    if (debit.value <= 0 && credit.value <= 0) {
        return 'Vous devez saisir un montant au débit ou au crédit';
    }
    
    if (debit.value > 0 && credit.value > 0) {
        return 'Une écriture ne peut pas avoir à la fois un débit et un crédit';
    }
    
    return null;
};

// Traitement de la création d'écriture
const traiterCreation = async () => {
    messageErreur.value = '';
    messageSucces.value = '';
    
    const erreurValidation = validerFormulaire();
    if (erreurValidation) {
        messageErreur.value = erreurValidation;
        return;
    }

    enCoursEnvoi.value = true;
    
    try {
        const dateFormatee = formaterDatePourPostgres(date.value);
        const donnees = {
            credit: credit.value,
            debit: debit.value,
            date: dateFormatee
        };
        
        // Appel au service pour créer la ligne de journal
        await journalService.creerLigneJournal(
            donnees, 
            journal.value, 
            compte.value,
            // Générer un numéro de ligne unique (à adapter selon vos besoins)
            Math.floor(Math.random() * 1000) + 1
        );
        
        messageSucces.value = 'Écriture enregistrée avec succès !';
        
        // Réinitialisation des montants
        debit.value = 0;
        credit.value = 0;
    } catch (erreur) {
        console.error(erreur);
        messageErreur.value = erreur.response?.data?.message || 'Erreur lors de l\'enregistrement de l\'écriture';
    } finally {
        enCoursEnvoi.value = false;
    }
};

// Chargement initial des données
onMounted(async () => {
    try {
        // Chargement en parallèle des journaux et comptes
        const [reponseJournals, reponseComptes] = await Promise.all([
            journalService.getGrandLivre(),
            compteService.getCompte()
        ]);
        
        journals.value = reponseJournals || [];
        comptes.value = reponseComptes || [];
    } catch (erreur) {
        messageErreur.value = 'Erreur lors du chargement des données initiales';
        console.error('Erreur API:', erreur);
    }
});
</script>

<style scoped>
.groupe-formulaire {
    margin-bottom: 1rem;
}

label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: bold;
}

input, select {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid #ccc;
    border-radius: 4px;
}

button {
    padding: 0.5rem 1rem;
    background-color: #4CAF50;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 1rem;
}

button:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
}

.message-erreur {
    color: #d32f2f;
    margin-top: 1rem;
    padding: 0.5rem;
    background-color: #ffebee;
    border-radius: 4px;
}

.message-succes {
    color: #388e3c;
    margin-top: 1rem;
    padding: 0.5rem;
    background-color: #e8f5e9;
    border-radius: 4px;
}
</style>