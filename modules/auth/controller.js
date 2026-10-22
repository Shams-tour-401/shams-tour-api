// modules/auth/controller.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const { pool } = require('../../config/db');

// Configuration de l'envoi de mail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// 1. CONNEXION
async function login(req, res) {
  try {
    const { identifiant, mot_de_passe } = req.body; // identifiant = email pour les clients
    if (!identifiant || !mot_de_passe) return res.status(400).json({ error: 'Champs requis' });

    const [rows] = await pool.query('SELECT * FROM utilisateur WHERE (email = ? OR identifiant = ?) AND statut = "actif"', [identifiant, identifiant]);
    if (rows.length === 0) return res.status(401).json({ error: 'Identifiants incorrects' });

    const utilisateur = rows[0];
    const valide = await bcrypt.compare(mot_de_passe, utilisateur.mot_de_passe_hash);
    if (!valide) return res.status(401).json({ error: 'Identifiants incorrects' });

    await pool.query('UPDATE utilisateur SET derniere_connexion = NOW() WHERE id = ?', [utilisateur.id]);

    const token = jwt.sign(
      { id: utilisateur.id, role: utilisateur.role, nom_complet: utilisateur.nom_complet },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ message: 'Connexion réussie', token, utilisateur: { id: utilisateur.id, nom: utilisateur.nom, prenom: utilisateur.prenom, email: utilisateur.email,sexe: utilisateur.sexe, role: utilisateur.role } });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

// 2. INSCRIPTION
async function register(req, res) {
  try {
    const { nom, prenom, email, mot_de_passe, sexe } = req.body;
    if (!nom || !prenom || !email || !mot_de_passe || !sexe) return res.status(400).json({ error: 'Tous les champs sont obligatoires' });

    const [existant] = await pool.query('SELECT id FROM utilisateur WHERE email = ?', [email]);
    if (existant.length > 0) return res.status(400).json({ error: 'Cet email est déjà utilisé' });

    const hash = await bcrypt.hash(mot_de_passe, 10);
    const identifiant = email.split('@')[0] + Math.floor(Math.random() * 1000);
    const nomComplet = `${prenom} ${nom}`;

    await pool.query(`
      INSERT INTO utilisateur (identifiant, prenom, nom, nom_complet, email, sexe, mot_de_passe_hash, role, statut)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'client', 'actif')
    `, [identifiant, prenom, nom, nomComplet, email, sexe, hash]);

    res.status(201).json({ message: 'Compte créé avec succès' });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

// 3. MOT DE PASSE OUBLIÉ (Envoi du mail avec le PIN)
async function forgotPassword(req, res) {
  try {
    const { email } = req.body;
    const [users] = await pool.query('SELECT id FROM utilisateur WHERE email = ?', [email]);
    if (users.length === 0) return res.status(404).json({ error: 'Aucun compte associé à cet email' });

    const pin = Math.floor(100000 + Math.random() * 900000).toString();
    const expiration = new Date(Date.now() + 15 * 60000); // 15 minutes

    await pool.query(`INSERT INTO reinitialisation_pin (email, code_pin, expiration) VALUES (?, ?, ?)`, [email, pin, expiration]);

    const mailOptions = {
      from: `"Shams Tour" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Code de réinitialisation - Shams Tour',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
          <h2 style="color: #C0392B; text-align: center;">Shams Tour</h2>
          <p>Voici votre code pour réinitialiser votre mot de passe :</p>
          <h1 style="text-align: center; letter-spacing: 5px; color: #2C3E50;">${pin}</h1>
          <p style="text-align: center; font-size: 12px; color: #7f8c8d;">Valable 15 minutes.</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    res.json({ message: 'Code envoyé par email.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors de l\'envoi de l\'email.' });
  }
}

// 4. RÉINITIALISATION DU MOT DE PASSE
async function resetPassword(req, res) {
  try {
    const { email, code_pin, nouveau_mot_de_passe } = req.body;

    const [pins] = await pool.query(`
      SELECT * FROM reinitialisation_pin 
      WHERE email = ? AND code_pin = ? AND expiration > NOW() AND utilise = 0
      ORDER BY id DESC LIMIT 1
    `, [email, code_pin]);

    if (pins.length === 0) return res.status(400).json({ error: 'Code PIN invalide ou expiré' });

    const hash = await bcrypt.hash(nouveau_mot_de_passe, 10);
    await pool.query('UPDATE utilisateur SET mot_de_passe_hash = ? WHERE email = ?', [hash, email]);
    await pool.query('UPDATE reinitialisation_pin SET utilise = 1 WHERE id = ?', [pins[0].id]);

    res.json({ message: 'Mot de passe réinitialisé avec succès' });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
}



async function getMe(req, res) {
  try {
    const [rows] = await pool.query(
      'SELECT id, identifiant, nom_complet, role FROM utilisateur WHERE id = ?',
      [req.utilisateur.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Utilisateur non trouvé' });
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

// PUT /api/auth/profil
async function updateProfil(req, res) {
  try {
    const { nom, prenom, email, sexe } = req.body;
    const userId = req.utilisateur.id; // Récupéré via le middleware verifierToken

    await pool.query(`
      UPDATE utilisateur 
      SET nom = ?, prenom = ?, email = ?, sexe = ?
      WHERE id = ?
    `, [nom, prenom, email, sexe, userId]);

    res.json({ message: 'Profil mis à jour avec succès' });
  } catch (error) {
    console.error(error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Cet email est déjà utilisé par un autre compte' });
    }
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

// PUT /api/auth/change-password
async function changePassword(req, res) {
  try {
    const { ancien_mot_de_passe, nouveau_mot_de_passe } = req.body;
    const userId = req.utilisateur.id;

    // 1. Récupérer l'utilisateur
    const [rows] = await pool.query('SELECT mot_de_passe_hash FROM utilisateur WHERE id = ?', [userId]);
    
    // 2. Vérifier l'ancien mot de passe
    const valide = await bcrypt.compare(ancien_mot_de_passe, rows[0].mot_de_passe_hash);
    if (!valide) {
      return res.status(400).json({ error: 'L\'ancien mot de passe est incorrect' });
    }

    // 3. Hasher et enregistrer le nouveau
    const hash = await bcrypt.hash(nouveau_mot_de_passe, 10);
    await pool.query('UPDATE utilisateur SET mot_de_passe_hash = ? WHERE id = ?', [hash, userId]);

    res.json({ message: 'Mot de passe modifié avec succès' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}


module.exports = { 
  login, 
  register, 
  forgotPassword, 
  resetPassword,
  updateProfil,
  changePassword,
  getMe 
};

