-- Table des utilisateurs
CREATE TABLE utilisateurs (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(100),
    prenom VARCHAR(100),
    email VARCHAR(255) UNIQUE NOT NULL,
    mot_de_passe VARCHAR(255) NOT NULL,
    clef_utilisateur VARCHAR(255),
    role VARCHAR(50) -- 'client', 'admin', 'employé'
);

-- Table des offres
CREATE TABLE offres (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(50),
    description TEXT,
    prix DECIMAL(10, 2),
    capacite INTEGER
);

-- Création du panier (panier général par utilisateur)
CREATE TABLE paniers (
    id SERIAL PRIMARY KEY,
    utilisateur_id INTEGER REFERENCES utilisateurs(id)
);

-- Ligne du panier (offres sélectionnées)
CREATE TABLE lignes_panier (
    id SERIAL PRIMARY KEY,
    panier_id INTEGER REFERENCES paniers(id),
    offre_id INTEGER REFERENCES offres(id),
    quantite INTEGER
);

-- Réservations (achats réalisés)
CREATE TABLE reservations (
    id SERIAL PRIMARY KEY,
    utilisateur_id INTEGER REFERENCES utilisateurs(id),
    date_achat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    statut VARCHAR(20),
    clef1 VARCHAR(255),
    clef_finale VARCHAR(255)
);

-- Les e-billets (tickets, avec QR code)
CREATE TABLE billets (
    id SERIAL PRIMARY KEY,
    reservation_id INTEGER REFERENCES reservations(id),
    offre_id INTEGER REFERENCES offres(id),
    date_validite TIMESTAMP,
    qr_code TEXT
);

-- Stockage des clés de sécurité
CREATE TABLE cles_securite (
    id SERIAL PRIMARY KEY,
    utilisateur_id INTEGER REFERENCES utilisateurs(id),
    clef_utilisateur VARCHAR(255),
    clef_achat VARCHAR(255),
    date_generation TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);