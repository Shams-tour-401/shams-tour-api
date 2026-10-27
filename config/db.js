// config/db.js
const mysql = require('mysql2/promise');
require('dotenv').config();

// On prépare la configuration SSL
let sslConfig = false;
if (process.env.DB_SSL === 'true') {
  sslConfig = {
    rejectUnauthorized: true,
    // On lit le certificat depuis la variable d'environnement
    ca: process.env.DB_SSL_CA 
  };
}

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4',
  ssl: sslConfig // On applique la config SSL
});

// Test de connexion
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Connexion MySQL réussie');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Erreur de connexion MySQL :', error.message);
    return false;
  }
}

module.exports = { pool, testConnection };
