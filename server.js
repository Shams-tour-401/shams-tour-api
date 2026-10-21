// server.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { testConnection } = require('./config/db');

const app = express();
const PORT = process.env.PORT || 3000;

// ============ MIDDLEWARES ============
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============ ROUTES ============
const activitesRoutes = require('./modules/activites/routes');
const destinationsRoutes = require('./modules/destinations/routes');
const circuitsRoutes = require('./modules/circuits/routes');
const tarifsRoutes = require('./modules/tarifs/routes');
const lieuxRoutes = require('./modules/lieux/routes');
const trajetsRoutes = require('./modules/trajets/routes');
const authRoutes = require('./modules/auth/routes');
const demandesRoutes = require('./modules/demandes/routes');
const prestatairesRoutes = require('./modules/prestataires/routes');
const propositionsRoutes = require('./modules/propositions/routes');
const alertesRoutes = require('./modules/alertes/routes');

app.get('/', (req, res) => {
  res.json({
    message: 'API Shams Tour',
    version: '1.0.0',
    status: 'OK',
    endpoints: {
      destinations: '/api/destinations',
      activites: '/api/activites',
      circuits: '/api/circuits',
      tarifs: '/api/tarifs',
      lieux: '/api/lieux',
      trajets: '/api/trajets'
    }
  });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.use('/api/activites', activitesRoutes);
app.use('/api/destinations', destinationsRoutes);
app.use('/api/circuits', circuitsRoutes);
app.use('/api/tarifs', tarifsRoutes);
app.use('/api/lieux', lieuxRoutes);
app.use('/api/trajets', trajetsRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/demandes', demandesRoutes);
app.use('/api/prestataires', prestatairesRoutes);
app.use('/api/demandes', propositionsRoutes);
app.use('/api/alertes', alertesRoutes);

// ============ DÉMARRAGE ============
async function startServer() {
  const dbConnected = await testConnection();
  
  if (!dbConnected) {
    console.error('⚠️  Démarrage annulé : impossible de se connecter à MySQL');
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
    console.log(`📊 Environnement : ${process.env.NODE_ENV}`);
  });
}

startServer();