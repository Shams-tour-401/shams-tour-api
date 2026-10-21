// modules/propositions/controller.js
const { pool } = require('../../config/db');

// GET /api/demandes/:id/propositions - Liste les propositions d'une demande
async function getPropositionsByDemande(req, res) {
  try {
    const { id } = req.params;
    const [propositions] = await pool.query(`
      SELECT p.*, u.nom_complet AS auteur_nom,
             u2.nom_complet AS accord_recueilli_par_nom
      FROM proposition p
      LEFT JOIN utilisateur u ON p.auteur_id = u.id
      LEFT JOIN utilisateur u2 ON p.accord_recueilli_par = u2.id
      WHERE p.demande_id = ?
      ORDER BY p.numero_version DESC
    `, [id]);

    // Récupérer les éléments pour chaque proposition
    for (const prop of propositions) {
      const [elements] = await pool.query(`
        SELECT ep.*, a.nom AS activite_nom
        FROM element_proposition ep
        LEFT JOIN activite a ON ep.activite_id = a.id
        WHERE ep.proposition_id = ?
        ORDER BY ep.jour, ep.horaire_debut
      `, [prop.id]);
      prop.elements = elements;
    }

    res.json(propositions);
  } catch (error) {
    console.error('Erreur getPropositionsByDemande :', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

// POST /api/demandes/:id/propositions - Créer une nouvelle version
async function creerProposition(req, res) {
  try {
    const { id } = req.params;
    const { elements, notes } = req.body;

    // Vérifier la demande
    const [demandes] = await pool.query(
      'SELECT * FROM demande WHERE id = ?',
      [id]
    );

    if (demandes.length === 0) {
      return res.status(404).json({ error: 'Demande non trouvée' });
    }

    // Récupérer la dernière version
    const [derniere] = await pool.query(`
      SELECT MAX(numero_version) AS max_version
      FROM proposition
      WHERE demande_id = ?
    `, [id]);

    const nouvelleVersion = (derniere[0].max_version || 0) + 1;

    // Calculer le total
    let total = 0;
    if (elements && elements.length > 0) {
      total = elements.reduce((sum, el) => sum + (el.prix || 0), 0);
    }

    // Calculer les écarts (différence avec la version précédente)
    let ecarts = '';
    if (nouvelleVersion > 1) {
      const [ancienne] = await pool.query(`
        SELECT * FROM proposition
        WHERE demande_id = ?
        ORDER BY numero_version DESC
        LIMIT 1
      `, [id]);

      if (ancienne.length > 0) {
        const diffPrix = total - ancienne[0].total;
        ecarts = `Prix : ${diffPrix > 0 ? '+' : ''}${diffPrix.toLocaleString('fr-FR')} Ar`;
      }
    }

    // Créer la proposition
    const [result] = await pool.query(`
      INSERT INTO proposition (
        demande_id, numero_version, auteur_id, total, ecarts
      ) VALUES (?, ?, ?, ?, ?)
    `, [id, nouvelleVersion, req.utilisateur.id, total, ecarts]);

    const propositionId = result.insertId;

    // Insérer les éléments
    if (elements && elements.length > 0) {
      for (const el of elements) {
        await pool.query(`
          INSERT INTO element_proposition (
            proposition_id, jour, horaire_debut, horaire_fin,
            activite_id, libelle, prix, duree_min, statut_disponibilite
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'a_verifier')
        `, [
          propositionId,
          el.jour,
          el.horaire_debut || null,
          el.horaire_fin || null,
          el.activite_id || null,
          el.libelle,
          el.prix || 0,
          el.duree_min || null
        ]);
      }
    }

    // Enregistrer l'événement
    await pool.query(`
      INSERT INTO evenement (demande_id, type, auteur_id, detail)
      VALUES (?, 'version', ?, ?)
    `, [id, req.utilisateur.id, `Proposition v${nouvelleVersion} créée`]);

    res.status(201).json({
      message: `Proposition v${nouvelleVersion} créée`,
      id: propositionId,
      numero_version: nouvelleVersion
    });

  } catch (error) {
    console.error('Erreur creerProposition :', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

// POST /api/demandes/:id/propositions/:propId/accord - Enregistrer l'accord
async function enregistrerAccord(req, res) {
  try {
    const { id, propId } = req.params;
    const { mode } = req.body;

    if (!mode || !['telephone', 'ecrit', 'en_ligne'].includes(mode)) {
      return res.status(400).json({ error: 'Mode d\'accord invalide' });
    }

    // Vérifier que la proposition existe et appartient à la demande
    const [propositions] = await pool.query(`
      SELECT * FROM proposition
      WHERE id = ? AND demande_id = ?
    `, [propId, id]);

    if (propositions.length === 0) {
      return res.status(404).json({ error: 'Proposition non trouvée' });
    }

    // Vérifier que c'est la dernière version
    const [derniere] = await pool.query(`
      SELECT MAX(numero_version) AS max_version
      FROM proposition
      WHERE demande_id = ?
    `, [id]);

    if (propositions[0].numero_version !== derniere[0].max_version) {
      return res.status(400).json({ 
        error: 'L\'accord doit être enregistré sur la dernière version communiquée' 
      });
    }

    // Enregistrer l'accord
    await pool.query(`
      UPDATE proposition SET
        accord_mode = ?,
        accord_date = NOW(),
        accord_recueilli_par = ?
      WHERE id = ?
    `, [mode, req.utilisateur.id, propId]);

    // Enregistrer l'événement
    await pool.query(`
      INSERT INTO evenement (demande_id, type, auteur_id, detail)
      VALUES (?, 'accord', ?, ?)
    `, [id, req.utilisateur.id, `Accord client enregistré (${mode}) sur v${propositions[0].numero_version}`]);

    res.json({
      message: 'Accord enregistré',
      mode,
      date: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erreur enregistrerAccord :', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

// PUT /api/demandes/:id/propositions/:propId/elements/:elementId - Vérifier une ligne
async function verifierLigneProposition(req, res) {
  try {
    const { elementId } = req.params;
    const { statut_disponibilite } = req.body;

    const statutsValides = ['a_verifier', 'disponible', 'indisponible', 'remplacee'];
    if (!statutsValides.includes(statut_disponibilite)) {
      return res.status(400).json({ error: 'Statut invalide' });
    }

    await pool.query(`
      UPDATE element_proposition SET
        statut_disponibilite = ?,
        verifie_par = ?,
        verifie_le = NOW()
      WHERE id = ?
    `, [statut_disponibilite, req.utilisateur.id, elementId]);

    res.json({ message: 'Ligne mise à jour' });

  } catch (error) {
    console.error('Erreur verifierLigneProposition :', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

module.exports = {
  getPropositionsByDemande,
  creerProposition,
  enregistrerAccord,
  verifierLigneProposition
};