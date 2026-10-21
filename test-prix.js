// test-prix.js
const { calculerPrix } = require('./modules/moteur/prix');

// SC-11 du cahier des charges : 3 adultes, 1 enfant, 1 véhicule
const resultat = calculerPrix({
  activites: [
    { nom: 'Activité A', unite: 'par_adulte', prix_vente: 40000, prix_enfant: 20000 },
    { nom: 'Activité B', unite: 'par_groupe', prix_vente: 60000 }
  ],
  adultes: 3,
  enfants: 1,
  agesEnfants: [6],
  vehicule: { prix_vente: 80000, capacite: 4 },
  fraisDossier: 20000
});

console.log('Résultat du calcul :');
console.log(JSON.stringify(resultat, null, 2));

// Vérification
if (resultat.total === 300000) {
  console.log('✅ SC-11 : Test réussi ! Total = 300 000 Ar');
} else {
  console.log(`❌ SC-11 : Échec. Total = ${resultat.total} Ar (attendu 300 000 Ar)`);
}