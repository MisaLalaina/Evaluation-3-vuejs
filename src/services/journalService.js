import apiClient from "./api";

// Récupérer tous les journaux avec leurs lignes
const getGrandLivre = async () => {
  try {
    const response = await apiClient.get(
      `/models/GL_Journal?$filter=GL_Category_ID%20eq%201000000&$expand=GL_JournalLine`
    );
    return response.records;
  } catch (error) {
    console.error(
      "Erreur lors de la requête API:",
      error.response ? error.response.data : error.message
    );
    throw error;
  }
};

// Créer un nouveau journal
const createJournal = async (data) => {
  try {
    const dateIso = data.date.replace(" ", "T");
    const c_p_id = await findPeriodId(dateIso);

    const journal = {
      AD_Client_ID: 11,
      AD_Org_ID: 11,
      C_AcctSchema_ID: 101,
      C_DocType_ID: 115,
      C_Period_ID: c_p_id,
      Description: data.reference,
      PostingType: "A",
      GL_Category_ID: 1000000,
      DateAcct: dateIso,
      DateDoc: dateIso,
    };
    console.log("Journal à créer :", journal);

    const response = await apiClient.post("/models/GL_Journal", journal);
    return response;
  } catch (error) {
    console.error("Erreur lors de la création du journal :", {
      error: error.message,
      stack: error.stack,
    });
    throw new Error(`Échec de la création du journal : ${error.message}`);
  }
};

// Créer une ligne de journal (version simplifiée)
const createJournalLine1 = async (data, journal, compte, line) => {
  try {
    const journalline = {
      AD_Client_ID: 11,
      AD_Org_ID: 11,
      GL_Journal_ID: journal.id,
      Account_ID: compte.id,
      Line: line,
      C_Currency_ID: 100,
      DateAcct: data.date,
      AmtAcctDr: Number(data.debit),
      AmtAcctCr: Number(data.credit),
      AmtSourceDr: Number(data.debit),
      AmtSourceCr: Number(data.credit),
    };

    console.log("Journal Line à créer :", journalline);

    const response = await apiClient.post(
      "/models/GL_JournalLine",
      journalline
    );
    return response;
  } catch (error) {
    console.error("Erreur lors de la création du journal Line :", {
      error: error.message,
      stack: error.stack,
    });
    throw new Error(`Échec de la création du journal Line : ${error.message}`);
  }
};

// Créer une ligne de journal (version complète)
const createJournalLine = async (data, journal, compte, line) => {
  try {
    const dateIso = data.date.replace(" ", "T");
    const c_p_id = await findPeriodId(dateIso);

    const journalline = {
      AD_Client_ID: 11,
      AD_Org_ID: 11,
      GL_Journal_ID: journal.id,
      Account_ID: compte.id,
      Line: line,
      C_Currency_ID: 100,
      DateAcct: dateIso,
      AmtAcctDr: Number(data.debit),
      AmtAcctCr: Number(data.credit),
      AmtSourceDr: Number(data.debit),
      AmtSourceCr: Number(data.credit),
    };
    
    console.log("Journal Line à créer :", journalline);

    const response = await apiClient.post(
      "/models/GL_JournalLine",
      journalline
    );
    return response;
  } catch (error) {
    console.error("Erreur lors de la création du journal Line :", {
      error: error.message,
      stack: error.stack,
    });
    throw new Error(`Échec de la création du journal Line : ${error.message}`);
  }
};

// Trouver l'ID de période pour une date donnée
const findPeriodId = async (date) => {
  const isoDate = new Date(date).toISOString().split(".")[0];
  const response = await apiClient.get(`/models/C_Period`, {
    params: {
      $filter: `IsActive eq true and StartDate le ${isoDate} and EndDate ge ${isoDate}`,
    },
  });

  if (response.records && response.records.length > 0) {
    return response.records[0].id;
  }

  throw new Error(`Aucune période active ouverte trouvée pour la date ${date}`);
};

// Vérifier si un journal existe déjà
const journalExist = async (value) => {
  try {
    const response = await apiClient.get(
      `/models/GL_Journal?$filter=Description eq '${value}' AND IsActive eq true`
    );
    return response.records || [];
  } catch (error) {
    console.error("Erreur lors de la vérification du journal :", error);
    return [];
  }
};

// Supprimer un journal
const deleteJournal = async (journalId) => {
  try {
    // D'abord vérifier si le journal peut être supprimé
    const journal = await apiClient.get(`/models/GL_Journal/${journalId}?$expand=GL_JournalLine`);
    
    if (journal.DocStatus !== 'DR') {
      throw new Error("Seuls les journaux au statut 'Brouillon' peuvent être supprimés");
    }
    
    if (journal.GL_JournalLine && journal.GL_JournalLine.length > 0) {
      throw new Error("Impossible de supprimer un journal avec des lignes associées");
    }

    // Si les vérifications passent, procéder à la suppression
    const response = await apiClient.delete(`/models/GL_Journal/${journalId}`);
    return response;
  } catch (error) {
    console.error("Erreur lors de la suppression du journal:", {
      error: error.message,
      stack: error.stack,
    });
    throw new Error(`Échec de la suppression du journal : ${error.message}`);
  }
};

// Exporter toutes les méthodes
export default {
  getGrandLivre,
  createJournal,
  createJournalLine1,
  journalExist,
  findPeriodId,
  createJournalLine,
  deleteJournal
};