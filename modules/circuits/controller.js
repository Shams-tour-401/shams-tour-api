// modules/circuits/controller.js
const { pool } = require('../../config/db');

// GET /api/circuits - Liste tous les circuits
async function getAllCircuits(req, res) {
  try {
    const [rows] = await pool.query(`
      SELECT c.*, d.nom AS destination_nom
      FROM circuit c
      JOIN destination d ON d.id = 1
      ORDER BY c.duree_jours, c.nom
    `);
    res.json(rows);
  } catch (error) {
    console.error('Erreur getAllCircuits :', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

// GET /api/circuits/:id - Détail d'un circuit avec jours et éléments
async function getCircuitById(req, res) {
  try {
    const { id } = req.params;

    const [circuitRows] = await pool.query(
      'SELECT * FROM circuit WHERE id = ?',
      [id]
    );

    if (circuitRows.length === 0) {
      return res.status(404).json({ error: 'Circuit non trouvé' });
    }

    const [jours] = await pool.query(`
      SELECT * FROM jour_circuit
      WHERE circuit_id = ?
      ORDER BY position
    `, [id]);

    for (const jour of jours) {
      const [elements] = await pool.query(`
        SELECT ej.*, a.nom AS activite_nom, a.duree_min AS activite_duree
        FROM element_jour ej
        LEFT JOIN activite a ON ej.activite_id = a.id
        WHERE ej.jour_circuit_id = ?
        ORDER BY ej.position
      `, [jour.id]);
      jour.elements = elements;
    }

    res.json({ ...circuitRows[0], jours });
  } catch (error) {
    console.error('Erreur getCircuitById :', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

// POST /api/circuits - Créer un circuit
async function createCircuit(req, res) {
  try {
    const {
      nom, description, duree_jours,
      etiquettes, rythme, profils_adaptes, jours_permutables
    } = req.body;

    if (!nom || !duree_jours) {
      return res.status(400).json({ error: 'Champs obligatoires manquants' });
    }

    const [result] = await pool.query(`
      INSERT INTO circuit (
        nom, description, duree_jours,
        etiquettes, rythme, profils_adaptes,
        jours_permutables, statut
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'brouillon')
    `, [
      nom, description, duree_jours,
      etiquettes, rythme || 'equilibre', profils_adaptes,
      jours_permutables || 0
    ]);

    const circuitId = result.insertId;

    for (let i = 1; i <= duree_jours; i++) {
      await pool.query(`
        INSERT INTO jour_circuit (circuit_id, position, titre)
        VALUES (?, ?, ?)
      `, [circuitId, i, `Jour ${i}`]);
    }

    res.status(201).json({ 
      message: 'Circuit créé', 
      id: circuitId 
    });
  } catch (error) {
    console.error('Erreur createCircuit :', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

// PUT /api/circuits/:id - Modifier un circuit
async function updateCircuit(req, res) {
  try {
    const { id } = req.params;
    const {
      nom, description, duree_jours,
      etiquettes, rythme, profils_adaptes, jours_permutables
    } = req.body;

    const [result] = await pool.query(`
      UPDATE circuit SET
        nom = ?, description = ?, duree_jours = ?,
        etiquettes = ?, rythme = ?, profils_adaptes = ?,
        jours_permutables = ?
      WHERE id = ?
    `, [
      nom, description, duree_jours,
      etiquettes, rythme, profils_adaptes,
      jours_permutables || 0, id
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Circuit non trouvé' });
    }

    res.json({ message: 'Circuit mis à jour' });
  } catch (error) {
    console.error('Erreur updateCircuit :', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

// DELETE /api/circuits/:id - Supprimer un circuit
async function deleteCircuit(req, res) {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM circuit WHERE id = ?', [id]);
    res.json({ message: 'Circuit supprimé' });
  } catch (error) {
    console.error('Erreur deleteCircuit :', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

// POST /api/circuits/:id/publier - Publier un circuit (avec contrôle ADM-07)
async function publierCircuit(req, res) {
  try {
    const { id } = req.params;

    const [circuits] = await pool.query(
      'SELECT * FROM circuit WHERE id = ?',
      [id]
    );

    if (circuits.length === 0) {
      return res.status(404).json({ error: 'Circuit non trouvé' });
    }

    const [jours] = await pool.query(
      'SELECT * FROM jour_circuit WHERE circuit_id = ? ORDER BY position',
      [id]
    );

    const problemes = [];

    for (const jour of jours) {
      const [elements] = await pool.query(`
        SELECT ej.*, a.nom AS activite_nom, a.statut_actif,
               a.duree_min AS activite_duree
        FROM element_jour ej
        LEFT JOIN activite a ON ej.activite_id = a.id
        WHERE ej.jour_circuit_id = ?
      `, [jour.id]);

      if (elements.length === 0) {
        problemes.push(`${jour.titre} : aucun élément`);
      }

      for (const el of elements) {
        if (el.type === 'activite' && el.activite_id) {
          if (!el.statut_actif) {
            problemes.push(`${jour.titre} : activité "${el.activite_nom}" désactivée`);
          }

          const [tarifs] = await pool.query(`
            SELECT id FROM tarif
            WHERE activite_id = ? AND statut = 'confirme'
            LIMIT 1
          `, [el.activite_id]);

          if (tarifs.length === 0) {
            problemes.push(`${jour.titre} : activité "${el.activite_nom}" sans tarif confirmé`);
          }
        }

        if (el.type === 'trajet' && (!el.duree_min || el.duree_min === 0)) {
          problemes.push(`${jour.titre} : trajet sans durée`);
        }
      }
    }

    if (problemes.length > 0) {
      return res.status(400).json({
        error: 'Le circuit ne peut pas être publié',
        problemes
      });
    }

    await pool.query(
      'UPDATE circuit SET statut = "publie" WHERE id = ?',
      [id]
    );

    res.json({ message: 'Circuit publié avec succès' });
  } catch (error) {
    console.error('Erreur publierCircuit :', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

// POST /api/circuits/:id/jours/:jourId/elements - Ajouter un élément
async function ajouterElement(req, res) {
  try {
    const { jourId } = req.params;
    const {
      type, activite_id, lieu_depart_id, lieu_arrivee_id, duree_min
    } = req.body;

    if (!type || !duree_min) {
      return res.status(400).json({ error: 'Type et durée obligatoires' });
    }

    const [maxPos] = await pool.query(
      'SELECT COALESCE(MAX(position), 0) + 1 AS pos FROM element_jour WHERE jour_circuit_id = ?',
      [jourId]
    );

    const position = maxPos[0].pos;

    const [result] = await pool.query(`
      INSERT INTO element_jour (
        jour_circuit_id, type, activite_id,
        lieu_depart_id, lieu_arrivee_id,
        duree_min, position
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      jourId, type, activite_id || null,
      lieu_depart_id || null, lieu_arrivee_id || null,
      duree_min, position
    ]);

    res.status(201).json({ 
      message: 'Élément ajouté', 
      id: result.insertId 
    });
  } catch (error) {
    console.error('Erreur ajouterElement :', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

// DELETE /api/circuits/elements/:elementId - Supprimer un élément
async function supprimerElement(req, res) {
  try {
    const { elementId } = req.params;
    await pool.query('DELETE FROM element_jour WHERE id = ?', [elementId]);
    res.json({ message: 'Élément supprimé' });
  } catch (error) {
    console.error('Erreur supprimerElement :', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

// POST /api/circuits/recherche - Proposer des circuits adaptés (Pour le mobile)
async function rechercherCircuits(req, res) {
  try {
    const { selectionnerCircuits } = require('../moteur/selecteur');
    const { calculerPrix } = require('../moteur/prix');
    const criteres = req.body;
    
    // 1. Obtenir les circuits filtrés et classés par le moteur
    const resultatMoteur = await selectionnerCircuits(criteres);
    const { circuits, rejets } = resultatMoteur;
    
    if (!circuits || circuits.length === 0) {
      return res.status(200).json({
        message: 'Aucun circuit ne correspond exactement à vos critères',
        circuits: [],
        raison_du_refus: rejets || [],
        suggestion: 'Modifiez vos critères ou demandez un rappel sur mesure.'
      });
    }

    // 2. Pour chaque circuit, on récupère le détail et on calcule le prix
    const reponse = await Promise.all(circuits.map(async (r) => {
      
      // Récupérer les éléments du circuit
      const [elements] = await pool.query(`
        SELECT ej.*, a.nom AS activite_nom, t.prix_vente, t.unite
        FROM element_jour ej
        JOIN jour_circuit jc ON ej.jour_circuit_id = jc.id
        LEFT JOIN activite a ON ej.activite_id = a.id
        LEFT JOIN tarif t ON a.id = t.activite_id AND t.statut = 'confirme'
        WHERE jc.circuit_id = ?
        ORDER BY jc.position, ej.position
      `, [r.circuit.id]);

      // Préparer les données pour le moteur de prix
      const activites = elements.filter(e => e.type === 'activite' && e.prix_vente).map(e => ({
        nom: e.activite_nom,
        unite: e.unite,
        prix_vente: e.prix_vente,
        prix_enfant: Math.round(e.prix_vente / 2) // Simplification : enfant = moitié prix
      }));

      // Calculer le prix
      const calcul = calculerPrix({
        activites,
        adultes: criteres.adultes || 2,
        enfants: criteres.enfants || 0,
        agesEnfants: criteres.ages_enfants || [],
        vehicule: { prix_vente: 200000, capacite: 4 },
        fraisDossier: 20000
      });

      return {
        id: r.circuit.id,
        nom: r.circuit.nom,
        description: r.circuit.description,
        duree_jours: r.circuit.duree_jours,
        rythme: r.circuit.rythme,
        score: r.score,
        prix_estime: calcul.total,
        raison: genererRaison(r.circuit, criteres),
        elements: elements // On renvoie les éléments pour l'écran Programme (E4)
      };
    }));

    res.json({ 
      message: `${reponse.length} circuit(s) trouvé(s)`, 
      circuits: reponse 
    });

  } catch (error) {
    console.error('Erreur rechercherCircuits :', error);
    res.status(500).json({ error: 'Erreur lors de la recherche' });
  }
}

// Fonction utilitaire pour générer la raison du choix
function genererRaison(circuit, criteres) {
  const raisons = [];
  const etiquettes = (circuit.etiquettes || '').split(',');
  
  if (criteres.envies) {
    const enviesCommunes = criteres.envies.filter(e => etiquettes.includes(e));
    if (enviesCommunes.length > 0) {
      raisons.push(`correspond à vos envies de ${enviesCommunes.join(' et ')}`);
    }
  }
  
  if (circuit.rythme === criteres.rythme) {
    raisons.push(`rythme ${criteres.rythme}`);
  }
  
  if (raisons.length === 0) return "Correspond à vos critères de recherche";
  return "Ce circuit " + raisons.join(' et ');
}

// POST /api/circuits/recalculer - Recalculer le prix après suppression
async function recalculerPrix(req, res) {
  try {
    const { elements, adultes, enfants, ages_enfants } = req.body;
    const { calculerPrix } = require('../moteur/prix');

    // On récupère uniquement les activités qui ont un prix
    const activites = elements
      .filter(e => e.type === 'activite' && e.prix_vente)
      .map(e => ({
        nom: e.activite_nom,
        unite: e.unite,
        prix_vente: e.prix_vente,
        prix_enfant: Math.round(e.prix_vente / 2)
      }));

    const calcul = calculerPrix({
      activites,
      adultes: adultes || 2,
      enfants: enfants || 0,
      agesEnfants: ages_enfants || [],
      vehicule: { prix_vente: 200000, capacite: 4 },
      fraisDossier: 20000
    });

    res.json({ nouveau_prix: calcul.total, details: calcul.lignes });
  } catch (error) {
    console.error('Erreur recalculerPrix :', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

module.exports = {
  getAllCircuits,
  getCircuitById,
  createCircuit,
  updateCircuit,
  deleteCircuit,
  publierCircuit,
  ajouterElement,
  recalculerPrix,
  supprimerElement,
  rechercherCircuits
};