// modules/demandes/controller.js
const { pool } = require('../../config/db');
const crypto = require('crypto');

// Générer une référence unique (ex: DEM-K7M4QX)
function genererReference() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Sans I, O, 0, 1 (ambigus)
  let ref = 'DEM-';
  for (let i = 0; i < 6; i++) {
    ref += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return ref;
}

// Générer un jeton de suivi long et aléatoire
function genererJeton() {
  return crypto.randomBytes(32).toString('hex');
}

// POST /api/demandes - Créer une demande
async function creerDemande(req, res) {
  try {
    const {
      destination_id,
      date_depart,
      nombre_jours,
      adultes,
      enfants = 0,
      ages_enfants = [],
      profil,
      envies = [],
      rythme,
      budget,
      budget_type,
      nom_client,
      telephone,
      creneau_rappel,
      commentaire,
      cle_envoi
    } = req.body;

    // Validation
    if (!destination_id || !date_depart || !nombre_jours || !adultes || !nom_client || !telephone || !cle_envoi) {
      return res.status(400).json({ 
        error: 'Champs obligatoires manquants' 
      });
    }

    // Idempotence : vérifier si la clé d'envoi existe déjà (RR-02)
    const [existante] = await pool.query(
      'SELECT * FROM demande WHERE cle_envoi = ?',
      [cle_envoi]
    );

    if (existante.length > 0) {
      return res.json({
        message: 'Demande déjà enregistrée',
        reference: existante[0].reference,
        jeton_suivi: existante[0].jeton_suivi,
        id: existante[0].id
      });
    }

    // Générer référence et jeton uniques
    let reference, jeton;
    let referenceUnique = false;
    let tentatives = 0;

    while (!referenceUnique && tentatives < 10) {
      reference = genererReference();
      const [check] = await pool.query(
        'SELECT id FROM demande WHERE reference = ?',
        [reference]
      );
      if (check.length === 0) referenceUnique = true;
      tentatives++;
    }

    jeton = genererJeton();

    // Insérer la demande
    const [result] = await pool.query(`
      INSERT INTO demande (
        reference, jeton_suivi, cle_envoi, statut,
        destination_id, date_depart, nombre_jours,
        adultes, enfants, ages_enfants,
        profil, envies, rythme,
        budget, budget_type,
        nom_client, telephone, creneau_rappel, commentaire
      ) VALUES (?, ?, ?, 'demande_recue', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      reference, jeton, cle_envoi,
      destination_id, date_depart, nombre_jours,
      adultes, enfants, JSON.stringify(ages_enfants),
      profil, envies.join(','), rythme,
      budget, budget_type,
      nom_client, telephone, creneau_rappel, commentaire
    ]);

    const demandeId = result.insertId;

    // Créer un événement dans le journal
    await pool.query(`
      INSERT INTO evenement (demande_id, type, detail)
      VALUES (?, 'statut', 'Demande reçue')
    `, [demandeId]);

    res.status(201).json({
      message: 'Demande envoyée avec succès',
      id: demandeId,
      reference,
      jeton_suivi: jeton,
      mention: 'Votre demande n\'est pas une réservation confirmée. Notre équipe vous contactera pour vérifier les disponibilités et confirmer votre voyage.'
    });

  } catch (error) {
    console.error('Erreur creerDemande :', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

// GET /api/demandes/suivi/:jeton - Suivi par jeton (VOY-06)
async function getDemandeByJeton(req, res) {
  try {
    const { jeton } = req.params;
    const [rows] = await pool.query(`
      SELECT d.*, dest.nom AS destination_nom
      FROM demande d
      JOIN destination dest ON d.destination_id = dest.id
      WHERE d.jeton_suivi = ?
    `, [jeton]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Demande non trouvée' });
    }

    const demande = rows[0];

    // Masquer le téléphone
    demande.telephone = masquerTelephone(demande.telephone);

    // Récupérer les propositions
    const [propositions] = await pool.query(`
      SELECT * FROM proposition
      WHERE demande_id = ?
      ORDER BY numero_version DESC
    `, [demande.id]);

    // Statut en langage clair
    const statutsTraduits = {
      'demande_recue': 'Demande reçue',
      'a_contacter': 'Nous allons vous appeler',
      'disponibilites_a_verifier': 'Vérification en cours',
      'proposition_a_valider': 'Une proposition est à valider avec vous',
      'confirmee': 'Voyage confirmé',
      'annulee': 'Demande annulée'
    };

    res.json({
      ...demande,
      statut_libelle: statutsTraduits[demande.statut] || demande.statut,
      propositions
    });

  } catch (error) {
    console.error('Erreur getDemandeByJeton :', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

// Masquer un numéro de téléphone
function masquerTelephone(tel) {
  if (!tel) return '';
  if (tel.length <= 6) return '••••••';
  return tel.substring(0, 4) + ' ••• ••• ' + tel.substring(tel.length - 3);
}

// GET /api/demandes - Liste des demandes (admin)
// GET /api/demandes - Liste des demandes (admin)
async function getAllDemandes(req, res) {
  try {
    const { statut, conseiller_id } = req.query;
    let query = `
      SELECT d.*, dest.nom AS destination_nom, u.nom_complet AS conseiller_nom
      FROM demande d
      JOIN destination dest ON d.destination_id = dest.id
      LEFT JOIN utilisateur u ON d.conseiller_id = u.id
    `;
    const params = [];
    const conditions = [];

    if (statut) {
      conditions.push('d.statut = ?');
      params.push(statut);
    }

    if (conseiller_id) {
      conditions.push('d.conseiller_id = ?');
      params.push(conseiller_id);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY d.date_creation DESC';

    const [rows] = await pool.query(query, params);

    // Détecter les doublons pour chaque demande
    for (const demande of rows) {
      const doublons = await detecterDoublons(demande);
      demande.doublons = doublons;
      demande.a_doublon = doublons.length > 0;
    }

    res.json(rows);

  } catch (error) {
    console.error('Erreur getAllDemandes :', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

// Détecter les doublons pour une demande
async function detecterDoublons(demande) {
  try {
    const [doublons] = await pool.query(`
      SELECT id, reference, date_depart, date_creation, statut
      FROM demande
      WHERE id != ?
        AND telephone = ?
        AND destination_id = ?
        AND ABS(DATEDIFF(date_depart, ?)) <= 3
        AND DATEDIFF(date_creation, ?) BETWEEN -7 AND 7
        AND statut != 'annulee'
      ORDER BY date_creation DESC
    `, [
      demande.id,
      demande.telephone,
      demande.destination_id,
      demande.date_depart,
      demande.date_creation
    ]);

    return doublons;
  } catch (error) {
    console.error('Erreur detecterDoublons :', error);
    return [];
  }
}

// GET /api/demandes/:id - Détail d'une demande (admin)
async function getDemandeById(req, res) {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(`
      SELECT d.*, dest.nom AS destination_nom, u.nom_complet AS conseiller_nom
      FROM demande d
      JOIN destination dest ON d.destination_id = dest.id
      LEFT JOIN utilisateur u ON d.conseiller_id = u.id
      WHERE d.id = ?
    `, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Demande non trouvée' });
    }

    const demande = rows[0];

    // Récupérer les événements
    const [evenements] = await pool.query(`
      SELECT e.*, u.nom_complet AS auteur_nom
      FROM evenement e
      LEFT JOIN utilisateur u ON e.auteur_id = u.id
      WHERE e.demande_id = ?
      ORDER BY e.date_evenement DESC
    `, [demande.id]);

    // Compter les tentatives d'appel
const [compteurAppels] = await pool.query(`
  SELECT 
    COUNT(*) AS total,
    SUM(CASE WHEN detail LIKE '%abouti%' THEN 1 ELSE 0 END) AS aboutis,
    SUM(CASE WHEN DATE(date_evenement) = CURDATE() THEN 1 ELSE 0 END) AS aujourd_hui,
    MAX(date_evenement) AS dernier_appel
  FROM evenement
  WHERE demande_id = ? AND type = 'appel'
`, [demande.id]);

    // Récupérer les notes
    const [notes] = await pool.query(`
      SELECT n.*, u.nom_complet AS auteur_nom
      FROM note n
      LEFT JOIN utilisateur u ON n.auteur_id = u.id
      WHERE n.demande_id = ?
      ORDER BY n.date_creation DESC
    `, [demande.id]);

    // Récupérer les propositions
    const [propositions] = await pool.query(`
      SELECT * FROM proposition
      WHERE demande_id = ?
      ORDER BY numero_version DESC
    `, [demande.id]);

    res.json({
      ...demande,
      evenements,
      notes,
      propositions,

        stats_appels: {
    total: compteurAppels[0].total || 0,
    aboutis: compteurAppels[0].aboutis || 0,
    aujourd_hui: compteurAppels[0].aujourd_hui || 0,
    dernier_appel: compteurAppels[0].dernier_appel
  }
    });

  } catch (error) {
    console.error('Erreur getDemandeById :', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

// PUT /api/demandes/:id/statut - Changer le statut (avec règles métier)
async function changerStatut(req, res) {
  try {
    const { id } = req.params;
    const { statut: nouveauStatut, motif } = req.body;

    // 1. Vérifier le statut valide
    const statutsValides = [
      'demande_recue', 'a_contacter', 'disponibilites_a_verifier',
      'proposition_a_valider', 'confirmee', 'annulee'
    ];

    if (!statutsValides.includes(nouveauStatut)) {
      return res.status(400).json({ error: 'Statut invalide' });
    }

    // 2. Récupérer la demande
    const [demandes] = await pool.query(
      'SELECT * FROM demande WHERE id = ?',
      [id]
    );

    if (demandes.length === 0) {
      return res.status(404).json({ error: 'Demande non trouvée' });
    }

    const demande = demandes[0];
    const ancienStatut = demande.statut;

    // 3. Vérifier les règles de transition
    const erreurs = await verifierReglesTransition(
      demande,
      ancienStatut,
      nouveauStatut,
      req.utilisateur
    );

    if (erreurs.length > 0) {
      return res.status(400).json({
        error: 'Transition impossible',
        regles: erreurs
      });
    }

    // 4. Motif obligatoire pour annulation
    if (nouveauStatut === 'annulee' && (!motif || motif.trim() === '')) {
      return res.status(400).json({ error: 'Motif obligatoire pour une annulation' });
    }

    // 5. Mettre à jour
    await pool.query(
      'UPDATE demande SET statut = ? WHERE id = ?',
      [nouveauStatut, id]
    );

    // 6. Enregistrer l'événement
    await pool.query(`
      INSERT INTO evenement (demande_id, type, auteur_id, detail)
      VALUES (?, 'statut', ?, ?)
    `, [
      id,
      req.utilisateur.id,
      `Statut changé de "${ancienStatut}" à "${nouveauStatut}"${motif ? ' - Motif : ' + motif : ''}`
    ]);

    res.json({
      message: 'Statut mis à jour',
      ancienStatut,
      nouveauStatut
    });

  } catch (error) {
    console.error('Erreur changerStatut :', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

// Vérifier les règles de transition
async function verifierReglesTransition(demande, ancienStatut, nouveauStatut, utilisateur) {
  const erreurs = [];

  // Règle 1 : Confirmer ou annuler une demande confirmée → admin uniquement
  if (ancienStatut === 'confirmee' && utilisateur.role !== 'administrateur') {
    if (nouveauStatut === 'annulee') {
      erreurs.push('Seul un administrateur peut annuler une demande confirmée');
    }
  }

  // Règle 2 : a_contacter → disponibilites_a_verifier : au moins 1 appel abouti
  if (ancienStatut === 'a_contacter' && nouveauStatut === 'disponibilites_a_verifier') {
    const [appels] = await pool.query(`
      SELECT id FROM evenement
      WHERE demande_id = ?
        AND type = 'appel'
        AND detail LIKE '%abouti%'
    `, [demande.id]);

    if (appels.length === 0) {
      erreurs.push('Au moins un appel abouti doit être enregistré avant de vérifier les disponibilités');
    }
  }

  // Règle 3 : disponibilites_a_verifier → proposition_a_valider : version existe + toutes lignes cochées
  if (ancienStatut === 'disponibilites_a_verifier' && nouveauStatut === 'proposition_a_valider') {
    const [propositions] = await pool.query(`
      SELECT id FROM proposition
      WHERE demande_id = ?
      ORDER BY numero_version DESC
      LIMIT 1
    `, [demande.id]);

    if (propositions.length === 0) {
      erreurs.push('Aucune proposition n\'existe encore');
    } else {
      const [lignesNonVerifiees] = await pool.query(`
        SELECT COUNT(*) AS nb FROM element_proposition
        WHERE proposition_id = ?
          AND statut_disponibilite = 'a_verifier'
      `, [propositions[0].id]);

      if (lignesNonVerifiees[0].nb > 0) {
        erreurs.push(`${lignesNonVerifiees[0].nb} ligne(s) de proposition encore à vérifier`);
      }
    }
  }

  // Règle 4 : proposition_a_valider → confirmee : accord client sur dernière version
  if (ancienStatut === 'proposition_a_valider' && nouveauStatut === 'confirmee') {
    const [propositions] = await pool.query(`
      SELECT * FROM proposition
      WHERE demande_id = ?
      ORDER BY numero_version DESC
      LIMIT 1
    `, [demande.id]);

    if (propositions.length === 0) {
      erreurs.push('Aucune proposition à valider');
    } else if (!propositions[0].accord_date) {
      erreurs.push('L\'accord du client n\'est pas encore enregistré');
    }
  }

  // Règle 5 : disponibilites_a_verifier → confirmee : seulement si version 1 inchangée
  if (ancienStatut === 'disponibilites_a_verifier' && nouveauStatut === 'confirmee') {
    const [propositions] = await pool.query(`
      SELECT * FROM proposition
      WHERE demande_id = ?
      ORDER BY numero_version DESC
      LIMIT 1
    `, [demande.id]);

    if (propositions.length === 0) {
      erreurs.push('Aucune proposition n\'existe');
    } else if (!propositions[0].accord_date) {
      erreurs.push('L\'accord du client n\'est pas enregistré');
    }

    const [lignesNonVerifiees] = await pool.query(`
      SELECT COUNT(*) AS nb FROM element_proposition
      WHERE proposition_id = ?
        AND statut_disponibilite = 'a_verifier'
    `, [propositions[0]?.id || 0]);

    if (lignesNonVerifiees[0].nb > 0) {
      erreurs.push('Toutes les disponibilités doivent être cochées');
    }
  }

  // Règle 6 : Annulation "injoignable" → 3 tentatives sur 2 jours
if (nouveauStatut === 'annulee' && motif === 'injoignable') {
  const [appels] = await pool.query(`
    SELECT 
      COUNT(DISTINCT DATE(date_evenement)) AS jours_differents,
      COUNT(*) AS total_tentatives
    FROM evenement
    WHERE demande_id = ? 
      AND type = 'appel'
      AND date_evenement >= DATE_SUB(NOW(), INTERVAL 2 DAY)
  `, [demande.id]);

  const jours = appels[0].jours_differents || 0;
  const total = appels[0].total_tentatives || 0;

  if (jours < 2 || total < 3) {
    erreurs.push(
      `Annulation "injoignable" impossible : ${total} tentative(s) sur ${jours} jour(s) ` +
      `(minimum requis : 3 tentatives sur 2 jours différents)`
    );
  }
}

  return erreurs;
}

// POST /api/demandes/:id/notes - Ajouter une note
async function ajouterNote(req, res) {
  try {
    const { id } = req.params;
    const { texte } = req.body;

    if (!texte || texte.trim() === '') {
      return res.status(400).json({ error: 'Le texte de la note est obligatoire' });
    }

    // Vérifier que la demande existe
    const [demandes] = await pool.query(
      'SELECT id FROM demande WHERE id = ?',
      [id]
    );

    if (demandes.length === 0) {
      return res.status(404).json({ error: 'Demande non trouvée' });
    }

    // Insérer la note
    const [result] = await pool.query(`
      INSERT INTO note (demande_id, texte, auteur_id)
      VALUES (?, ?, ?)
    `, [id, texte.trim(), req.utilisateur.id]);

    // Enregistrer l'événement
    await pool.query(`
      INSERT INTO evenement (demande_id, type, auteur_id, detail)
      VALUES (?, 'note', ?, ?)
    `, [id, req.utilisateur.id, 'Note ajoutée']);

    res.status(201).json({
      message: 'Note ajoutée',
      id: result.insertId
    });
  } catch (error) {
    console.error('Erreur ajouterNote :', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

// POST /api/demandes/:id/appels - Enregistrer un appel
async function enregistrerAppel(req, res) {
  try {
    const { id } = req.params;
    const { resultat, resume } = req.body;

    if (!resultat) {
      return res.status(400).json({ error: 'Le résultat de l\'appel est obligatoire' });
    }

    const [demandes] = await pool.query(
      'SELECT id FROM demande WHERE id = ?',
      [id]
    );

    if (demandes.length === 0) {
      return res.status(404).json({ error: 'Demande non trouvée' });
    }

    const detail = `Appel (${resultat})${resume ? ' - ' + resume : ''}`;

    const [result] = await pool.query(`
      INSERT INTO evenement (demande_id, type, auteur_id, detail)
      VALUES (?, 'appel', ?, ?)
    `, [id, req.utilisateur.id, detail]);

    res.status(201).json({
      message: 'Appel enregistré',
      id: result.insertId
    });
  } catch (error) {
    console.error('Erreur enregistrerAppel :', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

// GET /api/demandes/suivi/ref/:reference - Suivi par référence
async function getDemandeByReference(req, res) {
  try {
    const { reference } = req.params;
    const [rows] = await pool.query(`
      SELECT d.*, dest.nom AS destination_nom
      FROM demande d
      JOIN destination dest ON d.destination_id = dest.id
      WHERE d.reference = ?
    `, [reference]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Demande non trouvée' });
    }

    const demande = rows[0];
    // Masquer le téléphone
    demande.telephone = demande.telephone.substring(0, 4) + ' ••• ••• ' + demande.telephone.slice(-3);

    const statutsTraduits = {
      'demande_recue': 'Demande reçue',
      'a_contacter': 'Nous allons vous appeler',
      'disponibilites_a_verifier': 'Vérification en cours',
      'proposition_a_valider': 'Une proposition est à valider',
      'confirmee': 'Voyage confirmé',
      'annulee': 'Demande annulée'
    };

    res.json({
      ...demande,
      statut_libelle: statutsTraduits[demande.statut] || demande.statut
    });

  } catch (error) {
    console.error('Erreur getDemandeByReference :', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

module.exports = {
  creerDemande,
  getDemandeByJeton,
  getDemandeByReference,
  getAllDemandes,
  getDemandeById,
  changerStatut,
  ajouterNote,
  enregistrerAppel,
  verifierReglesTransition,
  detecterDoublons
};