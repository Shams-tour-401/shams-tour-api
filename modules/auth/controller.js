// modules/auth/controller.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../../config/db');

// POST /api/auth/login
async function login(req, res) {
  try {
    const { identifiant, mot_de_passe } = req.body;

    // Validation
    if (!identifiant || !mot_de_passe) {
      return res.status(400).json({ 
        error: 'Identifiant et mot de passe requis' 
      });
    }

    // Chercher l'utilisateur
    const [rows] = await pool.query(
      'SELECT * FROM utilisateur WHERE identifiant = ? AND statut = "actif"',
      [identifiant]
    );

    if (rows.length === 0) {
      return res.status(401).json({ 
        error: 'Identifiant ou mot de passe incorrect' 
      });
    }

    const utilisateur = rows[0];

    // Vérifier le mot de passe
    const motDePasseValide = await bcrypt.compare(
      mot_de_passe, 
      utilisateur.mot_de_passe_hash
    );

    if (!motDePasseValide) {
      return res.status(401).json({ 
        error: 'Identifiant ou mot de passe incorrect' 
      });
    }

    // Mettre à jour la dernière connexion
    await pool.query(
      'UPDATE utilisateur SET derniere_connexion = NOW() WHERE id = ?',
      [utilisateur.id]
    );

    // Générer le token JWT
    const token = jwt.sign(
      {
        id: utilisateur.id,
        identifiant: utilisateur.identifiant,
        role: utilisateur.role,
        nom_complet: utilisateur.nom_complet
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    res.json({
      message: 'Connexion réussie',
      token,
      utilisateur: {
        id: utilisateur.id,
        identifiant: utilisateur.identifiant,
        nom_complet: utilisateur.nom_complet,
        role: utilisateur.role
      }
    });

  } catch (error) {
    console.error('Erreur login :', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

// GET /api/auth/me - Récupérer l'utilisateur connecté
async function getMe(req, res) {
  try {
    const [rows] = await pool.query(
      'SELECT id, identifiant, nom_complet, role, derniere_connexion FROM utilisateur WHERE id = ?',
      [req.utilisateur.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Erreur getMe :', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

module.exports = { login, getMe };