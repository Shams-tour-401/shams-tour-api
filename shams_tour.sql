-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Hôte : 127.0.0.1
-- Généré le : ven. 23 oct. 2026 à 06:45
-- Version du serveur : 10.4.32-MariaDB
-- Version de PHP : 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de données : `shams_tour`
--

-- --------------------------------------------------------

--
-- Structure de la table `activite`
--

CREATE TABLE `activite` (
  `id` int(11) NOT NULL,
  `nom` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `categorie` varchar(50) DEFAULT NULL,
  `lieu_id` int(11) NOT NULL,
  `duree_min` int(11) NOT NULL COMMENT 'Durée en minutes',
  `creneaux` varchar(255) DEFAULT NULL COMMENT 'Ex: 08:00,14:00',
  `plage_debut` time DEFAULT NULL,
  `plage_fin` time DEFAULT NULL,
  `age_min` int(11) DEFAULT 0,
  `age_max` int(11) DEFAULT NULL,
  `effectif_min` int(11) NOT NULL DEFAULT 1,
  `effectif_max` int(11) NOT NULL DEFAULT 12,
  `dependance_meteo` tinyint(1) NOT NULL DEFAULT 0,
  `activite_repli_id` int(11) DEFAULT NULL,
  `inclus` text DEFAULT NULL,
  `non_inclus` text DEFAULT NULL,
  `statut_actif` tinyint(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `activite`
--

INSERT INTO `activite` (`id`, `nom`, `description`, `categorie`, `lieu_id`, `duree_min`, `creneaux`, `plage_debut`, `plage_fin`, `age_min`, `age_max`, `effectif_min`, `effectif_max`, `dependance_meteo`, `activite_repli_id`, `inclus`, `non_inclus`, `statut_actif`) VALUES
(1, 'Grotte d\'Anjohibe', 'Visite guidée de la grotte d\'Anjohibe, l\'une des plus grandes grottes de Madagascar.', 'Nature', 2, 180, '08:00,14:00', NULL, NULL, 6, NULL, 2, 12, 0, NULL, 'Guide, entrée, transport', 'Repas, boissons', 1),
(2, 'Phare du Katsepy', 'Visite du phare historique de Katsepy avec vue panoramique sur la baie de Majunga.', 'Culture', 3, 120, '09:00,15:00', NULL, NULL, 0, NULL, 1, 12, 0, NULL, 'Guide, entrée, transport', 'Repas, boissons', 1),
(3, 'Parc National Ankarafantsika', 'Safari et randonnée dans le parc national, à la découverte des lémuriens et oiseaux endémiques.', 'Nature', 4, 300, '07:00', NULL, NULL, 8, NULL, 2, 10, 1, NULL, 'Guide, entrée, transport', 'Repas, boissons', 1),
(4, 'Lac Sacré', 'Visite culturelle du lac sacré, lieu de culte et de tradition locale.', 'Culture', 5, 90, '08:00,16:00', NULL, NULL, 0, NULL, 1, 12, 0, NULL, 'Guide, transport', 'Repas, boissons', 1),
(5, 'Baie de Moramba', 'Excursion en bateau dans la baie de Moramba, à la découverte des tsingy et des baobabs.', 'Aventure', 6, 240, '08:00', NULL, NULL, 6, NULL, 2, 8, 1, NULL, 'Guide, bateau, transport', 'Repas, boissons', 1),
(6, 'Lac Sacré', 'bonjour', 'Culture', 5, 120, '08:00', NULL, NULL, 2, NULL, 5, 12, 0, NULL, 'hjj', 'jj', 0);

-- --------------------------------------------------------

--
-- Structure de la table `circuit`
--

CREATE TABLE `circuit` (
  `id` int(11) NOT NULL,
  `nom` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `duree_jours` int(11) NOT NULL,
  `etiquettes` varchar(255) DEFAULT NULL COMMENT 'Ex: nature,aventure',
  `rythme` enum('detente','equilibre','intense') NOT NULL DEFAULT 'equilibre',
  `profils_adaptes` varchar(255) DEFAULT NULL COMMENT 'Ex: couple,famille',
  `jours_permutables` tinyint(1) NOT NULL DEFAULT 0,
  `statut` enum('brouillon','publie','a_reviser') NOT NULL DEFAULT 'brouillon',
  `date_creation` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `circuit`
--

INSERT INTO `circuit` (`id`, `nom`, `description`, `duree_jours`, `etiquettes`, `rythme`, `profils_adaptes`, `jours_permutables`, `statut`, `date_creation`) VALUES
(1, 'Circuit Découverte 2 jours', 'Grotte d\'Anjohibe + Baie de Moramba. Idéal pour un premier séjour.', 2, 'nature,aventure', 'intense', 'couple,famille,amis', 0, 'publie', '2026-10-09 09:36:37'),
(2, 'Circuit Nature 3 jours', 'Parc Ankarafantsika + Lac Sacré + Phare de Katsepy. Pour les amoureux de nature et de culture.', 3, 'nature,culture', 'equilibre', 'couple,famille', 1, 'publie', '2026-10-09 09:36:37'),
(3, 'Circuit Aventure 5 jours', 'Toutes les activités : Grotte, Phare, Parc, Lac Sacré, Baie de Moramba.', 5, 'nature,aventure,culture', 'intense', 'amis', 0, 'brouillon', '2026-10-09 09:36:37');

-- --------------------------------------------------------

--
-- Structure de la table `demande`
--

CREATE TABLE `demande` (
  `id` int(11) NOT NULL,
  `reference` varchar(20) NOT NULL,
  `jeton_suivi` varchar(64) NOT NULL,
  `cle_envoi` varchar(64) NOT NULL,
  `statut` enum('demande_recue','a_contacter','disponibilites_a_verifier','proposition_a_valider','confirmee','annulee') NOT NULL DEFAULT 'demande_recue',
  `conseiller_id` int(11) DEFAULT NULL,
  `destination_id` int(11) NOT NULL,
  `date_depart` date NOT NULL,
  `nombre_jours` int(11) NOT NULL,
  `adultes` int(11) NOT NULL,
  `enfants` int(11) NOT NULL DEFAULT 0,
  `ages_enfants` varchar(255) DEFAULT NULL,
  `profil` enum('seul','couple','famille','amis') DEFAULT NULL,
  `envies` varchar(255) DEFAULT NULL,
  `rythme` enum('detente','equilibre','intense') DEFAULT NULL,
  `budget` int(11) DEFAULT NULL,
  `budget_type` enum('total_groupe','par_personne') DEFAULT NULL,
  `nom_client` varchar(100) NOT NULL,
  `telephone` varchar(30) NOT NULL,
  `creneau_rappel` varchar(50) DEFAULT NULL,
  `commentaire` text DEFAULT NULL,
  `sans_circuit` tinyint(1) NOT NULL DEFAULT 0,
  `date_creation` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `demande`
--

INSERT INTO `demande` (`id`, `reference`, `jeton_suivi`, `cle_envoi`, `statut`, `conseiller_id`, `destination_id`, `date_depart`, `nombre_jours`, `adultes`, `enfants`, `ages_enfants`, `profil`, `envies`, `rythme`, `budget`, `budget_type`, `nom_client`, `telephone`, `creneau_rappel`, `commentaire`, `sans_circuit`, `date_creation`) VALUES
(1, 'DEM-U64CGX', 'b08f88cd2c24880ebb276ab23a695ef720c0915ada56f5ab624af2e5587d0493', 'test-cle-unique-001', 'disponibilites_a_verifier', NULL, 1, '2026-12-15', 2, 2, 1, '[6]', 'famille', 'nature,aventure', 'equilibre', 500000, 'total_groupe', 'Jean Rakoto', '+261 34 12 345 67', 'matin', 'Premier s�jour � Madagascar', 0, '2026-10-09 11:32:08'),
(2, 'DEM-Q8GN3K', 'de4e5be2a8e81468664168b0db427531d8eec77a1f18be100c0a4353a8ffa61d', '1792515957535', 'demande_recue', NULL, 1, '2026-12-15', 2, 2, 0, '[]', 'famille', '', 'equilibre', NULL, 'total_groupe', 'Nanciah', '+261329923461', 'matin', 'Aaa\n', 0, '2026-10-20 20:05:58'),
(3, 'DEM-GH32QU', '045721a3ecb1c7f4b443d06e2d926e10fccd9b6a912220bc14fe35c7b2f5af4b', '1792605570504', 'demande_recue', NULL, 1, '2026-12-15', 2, 2, 0, '[]', 'famille', '', 'equilibre', NULL, 'total_groupe', 'Vonjiniaina', '0000000000', 'matin', 'Azerty\n', 0, '2026-10-21 20:59:31');

-- --------------------------------------------------------

--
-- Structure de la table `dependance`
--

CREATE TABLE `dependance` (
  `id` int(11) NOT NULL,
  `activite_source_id` int(11) NOT NULL,
  `activite_liee_id` int(11) DEFAULT NULL,
  `prestataire_lie_id` int(11) DEFAULT NULL,
  `type` enum('necessite','exclut') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `destination`
--

CREATE TABLE `destination` (
  `id` int(11) NOT NULL,
  `nom` varchar(100) NOT NULL,
  `statut_actif` tinyint(1) NOT NULL DEFAULT 1,
  `fenetre_debut` time NOT NULL DEFAULT '08:00:00',
  `fenetre_fin` time NOT NULL DEFAULT '19:00:00',
  `texte_accueil` text DEFAULT NULL,
  `date_creation` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `destination`
--

INSERT INTO `destination` (`id`, `nom`, `statut_actif`, `fenetre_debut`, `fenetre_fin`, `texte_accueil`, `date_creation`) VALUES
(1, 'Majunga', 1, '08:00:00', '19:00:00', 'Découvrez Majunga avec ceux qui la connaissent le mieux. L\'art de voyager, émotion de découvrir.', '2026-10-09 09:36:36');

-- --------------------------------------------------------

--
-- Structure de la table `element_jour`
--

CREATE TABLE `element_jour` (
  `id` int(11) NOT NULL,
  `jour_circuit_id` int(11) NOT NULL,
  `type` enum('activite','trajet','pause','temps_libre') NOT NULL,
  `activite_id` int(11) DEFAULT NULL,
  `lieu_depart_id` int(11) DEFAULT NULL,
  `lieu_arrivee_id` int(11) DEFAULT NULL,
  `duree_min` int(11) NOT NULL,
  `position` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `element_jour`
--

INSERT INTO `element_jour` (`id`, `jour_circuit_id`, `type`, `activite_id`, `lieu_depart_id`, `lieu_arrivee_id`, `duree_min`, `position`) VALUES
(1, 1, 'trajet', NULL, 1, 2, 90, 1),
(2, 1, 'activite', 1, NULL, NULL, 180, 2),
(3, 1, 'trajet', NULL, 2, 1, 90, 3),
(4, 2, 'trajet', NULL, 1, 6, 180, 1),
(5, 2, 'activite', 5, NULL, NULL, 240, 2),
(6, 2, 'trajet', NULL, 6, 1, 180, 3);

-- --------------------------------------------------------

--
-- Structure de la table `element_proposition`
--

CREATE TABLE `element_proposition` (
  `id` int(11) NOT NULL,
  `proposition_id` int(11) NOT NULL,
  `jour` int(11) NOT NULL,
  `horaire_debut` time DEFAULT NULL,
  `horaire_fin` time DEFAULT NULL,
  `activite_id` int(11) DEFAULT NULL,
  `libelle` varchar(255) NOT NULL,
  `prix` int(11) NOT NULL DEFAULT 0,
  `duree_min` int(11) DEFAULT NULL,
  `statut_disponibilite` enum('a_verifier','disponible','indisponible','remplacee') NOT NULL DEFAULT 'a_verifier',
  `verifie_par` int(11) DEFAULT NULL,
  `verifie_le` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `element_proposition`
--

INSERT INTO `element_proposition` (`id`, `proposition_id`, `jour`, `horaire_debut`, `horaire_fin`, `activite_id`, `libelle`, `prix`, `duree_min`, `statut_disponibilite`, `verifie_par`, `verifie_le`) VALUES
(1, 1, 1, NULL, NULL, NULL, 'balabala', 500, 30, 'a_verifier', NULL, NULL),
(2, 1, 1, NULL, NULL, NULL, 'bozy', 10000, 60, 'a_verifier', NULL, NULL),
(3, 2, 1, NULL, NULL, NULL, 'balabala2', 80000, 120, 'a_verifier', NULL, NULL),
(4, 3, 1, NULL, NULL, NULL, 'balabala3', 100000, 130, 'a_verifier', NULL, NULL),
(5, 4, 1, NULL, NULL, NULL, 'teste version 4', 180000, 30, 'a_verifier', NULL, NULL);

-- --------------------------------------------------------

--
-- Structure de la table `evenement`
--

CREATE TABLE `evenement` (
  `id` int(11) NOT NULL,
  `demande_id` int(11) NOT NULL,
  `type` enum('statut','appel','version','accord','note') NOT NULL,
  `auteur_id` int(11) DEFAULT NULL,
  `date_evenement` datetime NOT NULL DEFAULT current_timestamp(),
  `detail` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `evenement`
--

INSERT INTO `evenement` (`id`, `demande_id`, `type`, `auteur_id`, `date_evenement`, `detail`) VALUES
(1, 1, 'statut', NULL, '2026-10-09 11:32:08', 'Demande reçue'),
(2, 1, 'statut', 1, '2026-10-09 11:33:30', 'Statut changé en \"a_contacter\"'),
(3, 1, 'statut', 1, '2026-10-09 17:19:37', 'Statut changé en \"disponibilites_a_verifier\"'),
(4, 1, 'note', 1, '2026-10-12 15:58:57', 'Note ajoutée'),
(5, 1, 'statut', 1, '2026-10-12 16:50:40', 'Statut changé en \"proposition_a_valider\"'),
(6, 1, 'note', 3, '2026-10-12 17:49:20', 'Note ajoutée'),
(7, 1, 'statut', 3, '2026-10-12 18:35:31', 'Statut changé de \"proposition_a_valider\" à \"disponibilites_a_verifier\"'),
(8, 1, 'version', 3, '2026-10-12 18:50:44', 'Proposition v1 créée'),
(9, 1, 'version', 3, '2026-10-12 18:51:26', 'Proposition v2 créée'),
(10, 1, 'version', 1, '2026-10-12 18:56:30', 'Proposition v3 créée'),
(11, 1, 'version', 1, '2026-10-12 18:57:10', 'Proposition v4 créée'),
(12, 2, 'statut', NULL, '2026-10-20 20:05:58', 'Demande reçue'),
(13, 3, 'statut', NULL, '2026-10-21 20:59:31', 'Demande reçue');

-- --------------------------------------------------------

--
-- Structure de la table `indisponibilite`
--

CREATE TABLE `indisponibilite` (
  `id` int(11) NOT NULL,
  `activite_id` int(11) NOT NULL,
  `date_debut` date NOT NULL,
  `date_fin` date NOT NULL,
  `motif` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `jour_circuit`
--

CREATE TABLE `jour_circuit` (
  `id` int(11) NOT NULL,
  `circuit_id` int(11) NOT NULL,
  `position` int(11) NOT NULL,
  `titre` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `jour_circuit`
--

INSERT INTO `jour_circuit` (`id`, `circuit_id`, `position`, `titre`) VALUES
(1, 1, 1, 'Jour 1 : Grotte d\'Anjohibe'),
(2, 1, 2, 'Jour 2 : Baie de Moramba'),
(3, 2, 1, 'Jour 1 : Parc National Ankarafantsika'),
(4, 2, 2, 'Jour 2 : Lac Sacré'),
(5, 2, 3, 'Jour 3 : Phare du Katsepy'),
(6, 3, 1, 'Jour 1 : Grotte d\'Anjohibe'),
(7, 3, 2, 'Jour 2 : Baie de Moramba'),
(8, 3, 3, 'Jour 3 : Parc National Ankarafantsika'),
(9, 3, 4, 'Jour 4 : Lac Sacré'),
(10, 3, 5, 'Jour 5 : Phare du Katsepy');

-- --------------------------------------------------------

--
-- Structure de la table `lieu`
--

CREATE TABLE `lieu` (
  `id` int(11) NOT NULL,
  `nom` varchar(100) NOT NULL,
  `destination_id` int(11) NOT NULL,
  `type` enum('point_rendez_vous','site','restaurant','hebergement') NOT NULL DEFAULT 'site',
  `adresse` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `lieu`
--

INSERT INTO `lieu` (`id`, `nom`, `destination_id`, `type`, `adresse`) VALUES
(1, 'Centre-ville Majunga', 1, 'point_rendez_vous', 'Centre-ville, Majunga'),
(2, 'Grotte d\'Anjohibe', 1, 'site', 'Anjohibe, Majunga'),
(3, 'Phare du Katsepy', 1, 'site', 'Katsepy, Majunga'),
(4, 'Parc National Ankarafantsika', 1, 'site', 'Ankarafantsika, Majunga'),
(5, 'Lac Sacré', 1, 'site', 'Majunga'),
(6, 'Baie de Moramba', 1, 'site', 'Moramba, Majunga');

-- --------------------------------------------------------

--
-- Structure de la table `note`
--

CREATE TABLE `note` (
  `id` int(11) NOT NULL,
  `demande_id` int(11) NOT NULL,
  `texte` text NOT NULL,
  `auteur_id` int(11) DEFAULT NULL,
  `date_creation` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `note`
--

INSERT INTO `note` (`id`, `demande_id`, `texte`, `auteur_id`, `date_creation`) VALUES
(1, 1, 'bonjour', 1, '2026-10-12 15:58:57'),
(2, 1, 'bema', 3, '2026-10-12 17:49:20');

-- --------------------------------------------------------

--
-- Structure de la table `periode_ouverture`
--

CREATE TABLE `periode_ouverture` (
  `id` int(11) NOT NULL,
  `activite_id` int(11) NOT NULL,
  `jours_semaine` varchar(50) DEFAULT NULL COMMENT 'Ex: 1,2,3,4,5 (lundi=1)',
  `mois_debut` int(11) DEFAULT NULL,
  `mois_fin` int(11) DEFAULT NULL,
  `motif` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `photo`
--

CREATE TABLE `photo` (
  `id` int(11) NOT NULL,
  `activite_id` int(11) NOT NULL,
  `fichier` varchar(255) NOT NULL,
  `texte_alt` varchar(255) NOT NULL,
  `ordre` int(11) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `photo`
--

INSERT INTO `photo` (`id`, `activite_id`, `fichier`, `texte_alt`, `ordre`) VALUES
(2, 5, 'photo-1792697072273.jpg', 'Photo de l\'activité', 0),
(4, 5, 'photo-1792697462451.jpg', 'Photo de l\'activité', 0);

-- --------------------------------------------------------

--
-- Structure de la table `prestataire`
--

CREATE TABLE `prestataire` (
  `id` int(11) NOT NULL,
  `nom` varchar(100) NOT NULL,
  `telephones` varchar(255) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `statut` enum('actif','inactif') NOT NULL DEFAULT 'actif'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `prestataire`
--

INSERT INTO `prestataire` (`id`, `nom`, `telephones`, `notes`, `statut`) VALUES
(1, 'Shams Tour - Guide principal', '+261 37 27 644 62', 'Guide principal', 'actif'),
(2, 'Shams Tour - Véhicule 4x4', '+261 38 77 644 62', 'Véhicule 4x4 avec chauffeur', 'actif'),
(3, 'Guide', '+2315689475', 'Guide privé', 'actif');

-- --------------------------------------------------------

--
-- Structure de la table `proposition`
--

CREATE TABLE `proposition` (
  `id` int(11) NOT NULL,
  `demande_id` int(11) NOT NULL,
  `numero_version` int(11) NOT NULL DEFAULT 1,
  `date_creation` datetime NOT NULL DEFAULT current_timestamp(),
  `auteur_id` int(11) DEFAULT NULL,
  `total` int(11) NOT NULL DEFAULT 0,
  `ecarts` text DEFAULT NULL,
  `accord_mode` enum('telephone','ecrit','en_ligne') DEFAULT NULL,
  `accord_date` datetime DEFAULT NULL,
  `accord_recueilli_par` int(11) DEFAULT NULL,
  `version_catalogue` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `proposition`
--

INSERT INTO `proposition` (`id`, `demande_id`, `numero_version`, `date_creation`, `auteur_id`, `total`, `ecarts`, `accord_mode`, `accord_date`, `accord_recueilli_par`, `version_catalogue`) VALUES
(1, 1, 1, '2026-10-12 18:50:44', 3, 10500, '', NULL, NULL, NULL, NULL),
(2, 1, 2, '2026-10-12 18:51:26', 3, 80000, 'Prix : +69 500 Ar', NULL, NULL, NULL, NULL),
(3, 1, 3, '2026-10-12 18:56:30', 1, 100000, 'Prix : +20 000 Ar', NULL, NULL, NULL, NULL),
(4, 1, 4, '2026-10-12 18:57:10', 1, 180000, 'Prix : +80 000 Ar', NULL, NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Structure de la table `reinitialisation_pin`
--

CREATE TABLE `reinitialisation_pin` (
  `id` int(11) NOT NULL,
  `email` varchar(150) NOT NULL,
  `code_pin` varchar(6) NOT NULL,
  `expiration` datetime NOT NULL,
  `utilise` tinyint(1) DEFAULT 0,
  `date_creation` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `reinitialisation_pin`
--

INSERT INTO `reinitialisation_pin` (`id`, `email`, `code_pin`, `expiration`, `utilise`, `date_creation`) VALUES
(1, 'nanciah05@gmail.com', '107101', '2026-10-22 20:48:36', 0, '2026-10-22 20:33:36'),
(2, 'nanciah05@gmail.com', '219897', '2026-10-22 20:48:40', 1, '2026-10-22 20:33:40');

-- --------------------------------------------------------

--
-- Structure de la table `tarif`
--

CREATE TABLE `tarif` (
  `id` int(11) NOT NULL,
  `activite_id` int(11) DEFAULT NULL,
  `prestataire_id` int(11) DEFAULT NULL,
  `unite` enum('par_adulte','par_enfant','par_groupe','par_vehicule') NOT NULL,
  `tranche_age_min` int(11) DEFAULT NULL,
  `tranche_age_max` int(11) DEFAULT NULL,
  `prix_vente` int(11) NOT NULL COMMENT 'En ariary',
  `cout` int(11) DEFAULT NULL COMMENT 'En ariary',
  `periode_debut` date NOT NULL,
  `periode_fin` date NOT NULL,
  `statut` enum('confirme','a_confirmer') NOT NULL DEFAULT 'confirme',
  `derniere_verification` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `tarif`
--

INSERT INTO `tarif` (`id`, `activite_id`, `prestataire_id`, `unite`, `tranche_age_min`, `tranche_age_max`, `prix_vente`, `cout`, `periode_debut`, `periode_fin`, `statut`, `derniere_verification`) VALUES
(1, 1, NULL, 'par_adulte', NULL, NULL, 50000, 30000, '2026-01-01', '2026-12-31', 'confirme', '2026-10-01'),
(2, 1, NULL, 'par_enfant', NULL, NULL, 25000, 15000, '2026-01-01', '2026-12-31', 'confirme', '2026-10-01'),
(3, 2, NULL, 'par_adulte', NULL, NULL, 30000, 18000, '2026-01-01', '2026-12-31', 'confirme', '2026-10-01'),
(4, 2, NULL, 'par_enfant', NULL, NULL, 15000, 9000, '2026-01-01', '2026-12-31', 'confirme', '2026-10-01'),
(5, 3, NULL, 'par_adulte', NULL, NULL, 80000, 50000, '2026-01-01', '2026-12-31', 'confirme', '2026-10-01'),
(6, 3, NULL, 'par_enfant', NULL, NULL, 40000, 25000, '2026-01-01', '2026-12-31', 'confirme', '2026-10-01'),
(7, 4, NULL, 'par_adulte', NULL, NULL, 25000, 15000, '2026-01-01', '2026-12-31', 'confirme', '2026-10-01'),
(8, 4, NULL, 'par_enfant', NULL, NULL, 12000, 7000, '2026-01-01', '2026-12-31', 'confirme', '2026-10-01'),
(9, 5, NULL, 'par_adulte', NULL, NULL, 120000, 75000, '2026-01-01', '2026-12-31', 'confirme', '2026-10-01'),
(10, 5, NULL, 'par_enfant', NULL, NULL, 60000, 40000, '2026-01-01', '2026-12-31', 'confirme', '2026-10-01'),
(11, NULL, 2, 'par_vehicule', NULL, NULL, 200000, 150000, '2026-01-01', '2026-12-31', 'confirme', '2026-10-01');

-- --------------------------------------------------------

--
-- Structure de la table `trajet`
--

CREATE TABLE `trajet` (
  `id` int(11) NOT NULL,
  `lieu_depart_id` int(11) NOT NULL,
  `lieu_arrivee_id` int(11) NOT NULL,
  `duree_min` int(11) NOT NULL COMMENT 'Durée en minutes',
  `type_vehicule` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `trajet`
--

INSERT INTO `trajet` (`id`, `lieu_depart_id`, `lieu_arrivee_id`, `duree_min`, `type_vehicule`) VALUES
(1, 1, 2, 90, '4x4'),
(2, 1, 3, 45, '4x4'),
(3, 1, 4, 120, '4x4'),
(4, 1, 5, 60, '4x4'),
(5, 1, 6, 180, '4x4'),
(6, 2, 3, 120, '4x4'),
(7, 2, 4, 150, '4x4'),
(8, 2, 5, 100, '4x4'),
(9, 2, 6, 200, '4x4'),
(10, 3, 4, 130, '4x4'),
(11, 3, 5, 80, '4x4'),
(12, 3, 6, 190, '4x4'),
(13, 4, 5, 100, '4x4'),
(14, 4, 6, 180, '4x4'),
(15, 5, 6, 150, '4x4');

-- --------------------------------------------------------

--
-- Structure de la table `utilisateur`
--

CREATE TABLE `utilisateur` (
  `id` int(11) NOT NULL,
  `identifiant` varchar(50) NOT NULL,
  `prenom` varchar(100) DEFAULT NULL,
  `nom` varchar(100) DEFAULT NULL,
  `email` varchar(150) DEFAULT NULL,
  `sexe` enum('Homme','Femme') DEFAULT NULL,
  `mot_de_passe_hash` varchar(255) NOT NULL,
  `nom_complet` varchar(100) NOT NULL,
  `role` enum('administrateur','conseiller') NOT NULL DEFAULT 'conseiller',
  `statut` enum('actif','inactif') NOT NULL DEFAULT 'actif',
  `derniere_connexion` datetime DEFAULT NULL,
  `date_creation` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `utilisateur`
--

INSERT INTO `utilisateur` (`id`, `identifiant`, `prenom`, `nom`, `email`, `sexe`, `mot_de_passe_hash`, `nom_complet`, `role`, `statut`, `derniere_connexion`, `date_creation`) VALUES
(1, 'admin', NULL, NULL, NULL, NULL, '$2b$10$UiyaPBZFNMl3845GsppceO0JHpI30LUKVIc9RenwDGE4Fyg5FfePq', 'Administrateur Shams Tour', 'administrateur', 'actif', '2026-10-22 20:32:10', '2026-10-09 09:36:37'),
(3, 'conseiller', NULL, NULL, NULL, NULL, '$2b$10$o3Pqnw9LCQX86IjBS3NDQOYB7JePDYvJtXjNZvsoHv4GGJsLqwqfG', 'Conseiller Shams Tour', 'conseiller', 'actif', '2026-10-22 19:19:52', '2026-10-12 17:18:22'),
(4, 'nanciah05245', 'Nanciah', 'Rakotoson', 'nanciah05@gmail.com', 'Femme', '$2b$10$HDijZBBV4aAeQzFy80Z/DO/7HxrCtA.VBn/kGxO/NKl4G.8EzqxEm', 'Nanciah Rakotoson', '', 'actif', '2026-10-22 21:51:43', '2026-10-22 20:31:36');

--
-- Index pour les tables déchargées
--

--
-- Index pour la table `activite`
--
ALTER TABLE `activite`
  ADD PRIMARY KEY (`id`),
  ADD KEY `lieu_id` (`lieu_id`),
  ADD KEY `activite_repli_id` (`activite_repli_id`);

--
-- Index pour la table `circuit`
--
ALTER TABLE `circuit`
  ADD PRIMARY KEY (`id`);

--
-- Index pour la table `demande`
--
ALTER TABLE `demande`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `reference` (`reference`),
  ADD UNIQUE KEY `jeton_suivi` (`jeton_suivi`),
  ADD UNIQUE KEY `cle_envoi` (`cle_envoi`),
  ADD KEY `conseiller_id` (`conseiller_id`),
  ADD KEY `destination_id` (`destination_id`);

--
-- Index pour la table `dependance`
--
ALTER TABLE `dependance`
  ADD PRIMARY KEY (`id`),
  ADD KEY `activite_source_id` (`activite_source_id`),
  ADD KEY `activite_liee_id` (`activite_liee_id`),
  ADD KEY `prestataire_lie_id` (`prestataire_lie_id`);

--
-- Index pour la table `destination`
--
ALTER TABLE `destination`
  ADD PRIMARY KEY (`id`);

--
-- Index pour la table `element_jour`
--
ALTER TABLE `element_jour`
  ADD PRIMARY KEY (`id`),
  ADD KEY `jour_circuit_id` (`jour_circuit_id`),
  ADD KEY `activite_id` (`activite_id`),
  ADD KEY `lieu_depart_id` (`lieu_depart_id`),
  ADD KEY `lieu_arrivee_id` (`lieu_arrivee_id`);

--
-- Index pour la table `element_proposition`
--
ALTER TABLE `element_proposition`
  ADD PRIMARY KEY (`id`),
  ADD KEY `proposition_id` (`proposition_id`),
  ADD KEY `activite_id` (`activite_id`),
  ADD KEY `verifie_par` (`verifie_par`);

--
-- Index pour la table `evenement`
--
ALTER TABLE `evenement`
  ADD PRIMARY KEY (`id`),
  ADD KEY `demande_id` (`demande_id`),
  ADD KEY `auteur_id` (`auteur_id`);

--
-- Index pour la table `indisponibilite`
--
ALTER TABLE `indisponibilite`
  ADD PRIMARY KEY (`id`),
  ADD KEY `activite_id` (`activite_id`);

--
-- Index pour la table `jour_circuit`
--
ALTER TABLE `jour_circuit`
  ADD PRIMARY KEY (`id`),
  ADD KEY `circuit_id` (`circuit_id`);

--
-- Index pour la table `lieu`
--
ALTER TABLE `lieu`
  ADD PRIMARY KEY (`id`),
  ADD KEY `destination_id` (`destination_id`);

--
-- Index pour la table `note`
--
ALTER TABLE `note`
  ADD PRIMARY KEY (`id`),
  ADD KEY `demande_id` (`demande_id`),
  ADD KEY `auteur_id` (`auteur_id`);

--
-- Index pour la table `periode_ouverture`
--
ALTER TABLE `periode_ouverture`
  ADD PRIMARY KEY (`id`),
  ADD KEY `activite_id` (`activite_id`);

--
-- Index pour la table `photo`
--
ALTER TABLE `photo`
  ADD PRIMARY KEY (`id`),
  ADD KEY `activite_id` (`activite_id`);

--
-- Index pour la table `prestataire`
--
ALTER TABLE `prestataire`
  ADD PRIMARY KEY (`id`);

--
-- Index pour la table `proposition`
--
ALTER TABLE `proposition`
  ADD PRIMARY KEY (`id`),
  ADD KEY `demande_id` (`demande_id`),
  ADD KEY `auteur_id` (`auteur_id`),
  ADD KEY `accord_recueilli_par` (`accord_recueilli_par`);

--
-- Index pour la table `reinitialisation_pin`
--
ALTER TABLE `reinitialisation_pin`
  ADD PRIMARY KEY (`id`);

--
-- Index pour la table `tarif`
--
ALTER TABLE `tarif`
  ADD PRIMARY KEY (`id`),
  ADD KEY `activite_id` (`activite_id`),
  ADD KEY `prestataire_id` (`prestataire_id`);

--
-- Index pour la table `trajet`
--
ALTER TABLE `trajet`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_trajet` (`lieu_depart_id`,`lieu_arrivee_id`),
  ADD KEY `lieu_arrivee_id` (`lieu_arrivee_id`);

--
-- Index pour la table `utilisateur`
--
ALTER TABLE `utilisateur`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `identifiant` (`identifiant`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT pour les tables déchargées
--

--
-- AUTO_INCREMENT pour la table `activite`
--
ALTER TABLE `activite`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT pour la table `circuit`
--
ALTER TABLE `circuit`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT pour la table `demande`
--
ALTER TABLE `demande`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT pour la table `dependance`
--
ALTER TABLE `dependance`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `destination`
--
ALTER TABLE `destination`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT pour la table `element_jour`
--
ALTER TABLE `element_jour`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT pour la table `element_proposition`
--
ALTER TABLE `element_proposition`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT pour la table `evenement`
--
ALTER TABLE `evenement`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT pour la table `indisponibilite`
--
ALTER TABLE `indisponibilite`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `jour_circuit`
--
ALTER TABLE `jour_circuit`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT pour la table `lieu`
--
ALTER TABLE `lieu`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT pour la table `note`
--
ALTER TABLE `note`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT pour la table `periode_ouverture`
--
ALTER TABLE `periode_ouverture`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `photo`
--
ALTER TABLE `photo`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT pour la table `prestataire`
--
ALTER TABLE `prestataire`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT pour la table `proposition`
--
ALTER TABLE `proposition`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT pour la table `reinitialisation_pin`
--
ALTER TABLE `reinitialisation_pin`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT pour la table `tarif`
--
ALTER TABLE `tarif`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT pour la table `trajet`
--
ALTER TABLE `trajet`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT pour la table `utilisateur`
--
ALTER TABLE `utilisateur`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- Contraintes pour les tables déchargées
--

--
-- Contraintes pour la table `activite`
--
ALTER TABLE `activite`
  ADD CONSTRAINT `activite_ibfk_1` FOREIGN KEY (`lieu_id`) REFERENCES `lieu` (`id`),
  ADD CONSTRAINT `activite_ibfk_2` FOREIGN KEY (`activite_repli_id`) REFERENCES `activite` (`id`) ON DELETE SET NULL;

--
-- Contraintes pour la table `demande`
--
ALTER TABLE `demande`
  ADD CONSTRAINT `demande_ibfk_1` FOREIGN KEY (`conseiller_id`) REFERENCES `utilisateur` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `demande_ibfk_2` FOREIGN KEY (`destination_id`) REFERENCES `destination` (`id`);

--
-- Contraintes pour la table `dependance`
--
ALTER TABLE `dependance`
  ADD CONSTRAINT `dependance_ibfk_1` FOREIGN KEY (`activite_source_id`) REFERENCES `activite` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `dependance_ibfk_2` FOREIGN KEY (`activite_liee_id`) REFERENCES `activite` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `dependance_ibfk_3` FOREIGN KEY (`prestataire_lie_id`) REFERENCES `prestataire` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `element_jour`
--
ALTER TABLE `element_jour`
  ADD CONSTRAINT `element_jour_ibfk_1` FOREIGN KEY (`jour_circuit_id`) REFERENCES `jour_circuit` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `element_jour_ibfk_2` FOREIGN KEY (`activite_id`) REFERENCES `activite` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `element_jour_ibfk_3` FOREIGN KEY (`lieu_depart_id`) REFERENCES `lieu` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `element_jour_ibfk_4` FOREIGN KEY (`lieu_arrivee_id`) REFERENCES `lieu` (`id`) ON DELETE SET NULL;

--
-- Contraintes pour la table `element_proposition`
--
ALTER TABLE `element_proposition`
  ADD CONSTRAINT `element_proposition_ibfk_1` FOREIGN KEY (`proposition_id`) REFERENCES `proposition` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `element_proposition_ibfk_2` FOREIGN KEY (`activite_id`) REFERENCES `activite` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `element_proposition_ibfk_3` FOREIGN KEY (`verifie_par`) REFERENCES `utilisateur` (`id`) ON DELETE SET NULL;

--
-- Contraintes pour la table `evenement`
--
ALTER TABLE `evenement`
  ADD CONSTRAINT `evenement_ibfk_1` FOREIGN KEY (`demande_id`) REFERENCES `demande` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `evenement_ibfk_2` FOREIGN KEY (`auteur_id`) REFERENCES `utilisateur` (`id`) ON DELETE SET NULL;

--
-- Contraintes pour la table `indisponibilite`
--
ALTER TABLE `indisponibilite`
  ADD CONSTRAINT `indisponibilite_ibfk_1` FOREIGN KEY (`activite_id`) REFERENCES `activite` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `jour_circuit`
--
ALTER TABLE `jour_circuit`
  ADD CONSTRAINT `jour_circuit_ibfk_1` FOREIGN KEY (`circuit_id`) REFERENCES `circuit` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `lieu`
--
ALTER TABLE `lieu`
  ADD CONSTRAINT `lieu_ibfk_1` FOREIGN KEY (`destination_id`) REFERENCES `destination` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `note`
--
ALTER TABLE `note`
  ADD CONSTRAINT `note_ibfk_1` FOREIGN KEY (`demande_id`) REFERENCES `demande` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `note_ibfk_2` FOREIGN KEY (`auteur_id`) REFERENCES `utilisateur` (`id`) ON DELETE SET NULL;

--
-- Contraintes pour la table `periode_ouverture`
--
ALTER TABLE `periode_ouverture`
  ADD CONSTRAINT `periode_ouverture_ibfk_1` FOREIGN KEY (`activite_id`) REFERENCES `activite` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `photo`
--
ALTER TABLE `photo`
  ADD CONSTRAINT `photo_ibfk_1` FOREIGN KEY (`activite_id`) REFERENCES `activite` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `proposition`
--
ALTER TABLE `proposition`
  ADD CONSTRAINT `proposition_ibfk_1` FOREIGN KEY (`demande_id`) REFERENCES `demande` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `proposition_ibfk_2` FOREIGN KEY (`auteur_id`) REFERENCES `utilisateur` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `proposition_ibfk_3` FOREIGN KEY (`accord_recueilli_par`) REFERENCES `utilisateur` (`id`) ON DELETE SET NULL;

--
-- Contraintes pour la table `tarif`
--
ALTER TABLE `tarif`
  ADD CONSTRAINT `tarif_ibfk_1` FOREIGN KEY (`activite_id`) REFERENCES `activite` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `tarif_ibfk_2` FOREIGN KEY (`prestataire_id`) REFERENCES `prestataire` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `trajet`
--
ALTER TABLE `trajet`
  ADD CONSTRAINT `trajet_ibfk_1` FOREIGN KEY (`lieu_depart_id`) REFERENCES `lieu` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `trajet_ibfk_2` FOREIGN KEY (`lieu_arrivee_id`) REFERENCES `lieu` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
