// hash-password.js
const bcrypt = require('bcryptjs');

const motDePasse = 'admin123'; // Mot de passe en clair

bcrypt.hash(motDePasse, 10, (err, hash) => {
  if (err) {
    console.error('Erreur :', err);
    return;
  }
  console.log('Mot de passe :', motDePasse);
  console.log('Hash généré  :', hash);
  console.log('');
  console.log('Copiez ce hash dans la base de données (table utilisateur)');
});