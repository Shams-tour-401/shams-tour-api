// modules/photos/controller.js
const { pool } = require('../../config/db');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;

// Configuration de Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// On utilise memoryStorage pour garder l'image en mémoire avant de l'envoyer à Cloudinary
const storage = multer.memoryStorage();
const upload = multer({ storage }).array('photos', 5);

// POST /api/photos/:activiteId
async function uploadPhotos(req, res) {
  upload(req, res, async (err) => {
    if (err) return res.status(400).json({ error: 'Erreur lors de l\'upload' });
    if (!req.files || req.files.length === 0) return res.status(400).json({ error: 'Aucune photo fournie' });

    const { activiteId } = req.params;
    
    try {
      for (const file of req.files) {
        // 👇 ENVOI VERS CLOUDINARY
        const result = await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { folder: 'shams-tour' }, 
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );
          stream.end(file.buffer);
        });

        // On enregistre l'URL Cloudinary dans la base de données
        await pool.query(`
          INSERT INTO photo (activite_id, fichier, texte_alt)
          VALUES (?, ?, ?)
        `, [activiteId, result.secure_url, 'Photo de l\'activité']);
      }
      res.json({ message: 'Photos ajoutées avec succès' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  });
}

// GET /api/photos/:activiteId
async function getPhotosByActivite(req, res) {
  try {
    const { activiteId } = req.params;
    const [photos] = await pool.query('SELECT * FROM photo WHERE activite_id = ?', [activiteId]);
    
    // On renvoie directement l'URL Cloudinary stockée dans 'fichier'
    const photosAvecUrl = photos.map(p => ({
      ...p,
      url: p.fichier 
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
    await pool.query('DELETE FROM photo WHERE id = ?', [photoId]);
    res.json({ message: 'Photo supprimée' });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

module.exports = { uploadPhotos, getPhotosByActivite, deletePhoto };