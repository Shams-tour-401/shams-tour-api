const { pool } = require('../../config/db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configuration de Multer (où et comment stocker)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    // On renomme le fichier pour éviter les doublons
    cb(null, `photo-${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ storage }).array('photos', 5); // Max 5 photos

// POST /api/photos/:activiteId
async function uploadPhotos(req, res) {
  upload(req, res, async (err) => {
    if (err) return res.status(400).json({ error: 'Erreur lors de l\'upload' });
    if (!req.files || req.files.length === 0) return res.status(400).json({ error: 'Aucune photo fournie' });

    const { activiteId } = req.params;
    
    try {
      // Enregistrer chaque fichier dans la base de données
      for (const file of req.files) {
        await pool.query(`
          INSERT INTO photo (activite_id, fichier, texte_alt)
          VALUES (?, ?, ?)
        `, [activiteId, file.filename, 'Photo de l\'activité']);
      }
      res.json({ message: 'Photos ajoutées avec succès' });
    } catch (error) {
      res.status(500).json({ error: 'Erreur serveur' });
    }
  });
}

// GET /api/photos/:activiteId
async function getPhotosByActivite(req, res) {
  try {
    const { activiteId } = req.params;
    const [photos] = await pool.query('SELECT * FROM photo WHERE activite_id = ?', [activiteId]);
    // On renvoie l'URL complète pour que le mobile puisse l'afficher
    const photosAvecUrl = photos.map(p => ({
      ...p,
      url: `http://192.168.1.99:3000/uploads/${p.fichier}` 
    }));
    res.json(photosAvecUrl);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

// DELETE /api/photos/:photoId
async function deletePhoto(req, res) {
  try {
    const { photoId } = req.params;
    const [photos] = await pool.query('SELECT fichier FROM photo WHERE id = ?', [photoId]);
    
    if (photos.length > 0) {
      // Supprimer le fichier physique
      const chemin = path.join(__dirname, '../../uploads', photos[0].fichier);
      if (fs.existsSync(chemin)) fs.unlinkSync(chemin);
      
      // Supprimer de la base
      await pool.query('DELETE FROM photo WHERE id = ?', [photoId]);
    }
    res.json({ message: 'Photo supprimée' });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

module.exports = { uploadPhotos, getPhotosByActivite, deletePhoto };