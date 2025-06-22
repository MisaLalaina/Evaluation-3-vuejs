import apiClient from "./api";

// Fonction pour créer un nouveau compte
const createCompte = async (data) => {
  try {
    if (data.existeDeja !== true) {
      const compte = {
        AD_Client_ID: 11,
        AD_Org_ID: 11,
        Value: data.compte,
        Name: data.libelle,
        AccountType: "A",
        C_Element_ID: 105,
      };

      const response = await apiClient.post("/models/C_ElementValue", compte);
      return response;
    }
    return data;
  } catch (error) {
    console.error("Erreur lors de la création du compte :", {
      error: error.message,
      stack: error.stack,
    });
    throw new Error(`Échec de la création du compte : ${error.message}`);
  }
};

// Vérification si le compte existe déjà
const compteExist = async (value) => {
  try {
    const response = await apiClient.get(
      `/models/C_ElementValue?$filter=Value eq '${value}' AND IsActive eq true`
    );
    return Boolean(response?.records?.length);
  } catch (error) {
    console.error("Erreur lors de la vérification du compte :", error);
    return false;
  }
};

// Récupération d'un compte par son ID
const getCompteById = async (value) => {
  try {
    const response = await apiClient.get(
      `/models/C_ElementValue?$filter=Value eq '${value}' AND IsActive eq true`
    );
    return response?.records?.[0] || null;
  } catch (error) {
    console.error("Erreur lors de la récupération du compte :", error);
    return null;
  }
};

// Mise à jour d'un compte
const updateCompte = async (id, data) => {
  try {
    const response = await apiClient.patch(`/models/C_ElementValue/${id}`, data);
    return response;
  } catch (error) {
    console.error("Erreur lors de la mise à jour du compte :", {
      error: error.message,
      stack: error.stack,
    });
    throw new Error(`Échec de la mise à jour du compte : ${error.message}`);
  }
};

// Suppression (désactivation) d'un compte
const deleteCompte = async (id) => {
  try {
    const response = await apiClient.patch(`/models/C_ElementValue/${id}`, {
      IsActive: false,
    });
    return response;
  } catch (error) {
    console.error("Erreur lors de la suppression du compte :", {
      error: error.message,
      stack: error.stack,
    });
    throw new Error(`Échec de la suppression du compte : ${error.message}`);
  }
};

export default {
  createCompte,
  compteExist,
  getCompteById,
  updateCompte,
  deleteCompte,
};