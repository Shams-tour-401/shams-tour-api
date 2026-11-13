// modules/utilisateurs/controller.js
const { pool } = require('../../config/db');
const bcrypt = require('bcryptjs');

// GET /api/utilisateurs
async function getAllUtilisateurs(req, res) {
  try {
    const [rows] = await pool.query(`
      SELECT id, identifiant, nom_complet, role, statut, derniere_connexion, date_creation
      FROM utilisateur
      ORDER BY role, nom_complet
    `);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

// POST /api/utilisateurs
async function createUtilisateur(req, res) {
  try {
    const { identifiant, mot_de_passe, nom_complet, role } = req.body;

    if (!identifiant || !mot_de_passe || !nom_complet || !role) {
      return res.status(400).json({ error: 'Champs obligatoires manquants' });
    }

    const hash = await bcrypt.hash(mot_de_passe, 10);

    const [result] = await pool.query(`
      INSERT INTO utilisateur (identifiant, mot_de_passe_hash, nom_complet, role, statut)
      VALUES (?, ?, ?, ?, 'actif')
    `, [identifiant, hash, nom_complet, role]);

    res.status(201).json({ message: 'Utilisateur créé', id: result.insertId });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Cet identifiant existe déjà' });
    }
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

// PUT /api/utilisateurs/:id/statut
async function changerStatutUtilisateur(req, res) {
  try {
    const { id } = req.params;
    const { statut } = req.body;

    await pool.query('UPDATE utilisateur SET statut = ? WHERE id = ?', [statut, id]);
    res.json({ message: 'Statut mis à jour' });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
}



// ✅ NOUVELLE FONCTION : Changer son propre mot de passe
async function changerMotDePasse(req, res) {
  try {
    // req.user.id vient du middleware d'authentification (JWT)
    const userId = req.user.id; 
    const { ancien_mot_de_passe, nouveau_mot_de_passe } = req.body;

    // 1. Validation basique
    if (!ancien_mot_de_passe || !nouveau_mot_de_passe) {
      return res.status(400).json({ error: 'Tous les champs sont obligatoires.' });
    }
    if (nouveau_mot_de_passe.length < 6) {
      return res.status(400).json({ error: 'Le nouveau mot de passe doit faire au moins 6 caractères.' });
    }

    // 2. Récupérer l'utilisateur en base
    const [rows] = await pool.query(
      'SELECT mot_de_passe_hash FROM utilisateur WHERE id = ?',
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Utilisateur non trouvé.' });
    }

    const utilisateur = rows[0];

    // 3. Vérifier que l'ancien mot de passe est correct
    const motDePasseValide = await bcrypt.compare(ancien_mot_de_passe, utilisateur.mot_de_passe_hash);
    if (!motDePasseValide) {
      return res.status(401).json({ error: 'L\'ancien mot de passe est incorrect.' });
    }

    // 4. Hasher le nouveau mot de passe
    const nouveauHash = await bcrypt.hash(nouveau_mot_de_passe, 10);

    // 5. Mettre à jour la base
    await pool.query(
      'UPDATE utilisateur SET mot_de_passe_hash = ? WHERE id = ?',
      [nouveauHash, userId]
    );

    res.json({ message: 'Mot de passe mis à jour avec succès.' });
  } catch (error) {
    console.error('Erreur changement mot de passe:', error);
    res.status(500).json({ error: 'Erreur serveur lors du changement de mot de passe.' });
  }
}

module.exports = { getAllUtilisateurs, createUtilisateur, changerStatutUtilisateur, changerMotDePasse };
