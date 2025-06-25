import { createRouter, createWebHistory } from "vue-router";
import Login from "@/views/Login.vue";
import Balance from "@/views/Balance.vue";
import GrandLivre from "@/views/GrandLivre.vue";
import Import from "@/views/Import.vue";
import Dashbord from "@/views/Dashbord.vue";
import EcritureJournal from "@/views/EcritureJournal.vue";
import Compte from "@/views/Compte.vue";
import ListeEcriture from "@/views/ListeEcriture.vue";
import JournalListe from "@/views/JournalListe.vue";
// 
const routes = [
  {
    path: "/",
    name: "Login",
    component: Login,
  },
  {
    path: "/balance",
    name: "Balance",
    component: Balance,
  },
  {
    path: "/grandLivre",
    name: "GrandLivre",
    component: GrandLivre,
  },
  {
    path: "/import",
    name: "Import",
    component: Import,
  },
{
  path:"/dashboard",
  name: "Dashboard",
  component:Dashbord,
},
{
  path:"/Ecriture",
  name:"EcritureJournal",
  component:EcritureJournal,
},

{
  path:"/compte", //liste compte
  name:"Compte",
  component:Compte,
},

{
  path:"/journlecriture",
  name:"Journlecriture",
  component:ListeEcriture,
},
{
  path:"/journl",
  name:"JournalListe",
  component:JournalListe,
}



];


const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
