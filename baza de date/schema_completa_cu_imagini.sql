-- =====================================================
-- SCHEMA COMPLETA CU IMAGINI BLOB SI PAROLE ENCRYPTED
-- =====================================================

DROP DATABASE IF EXISTS magazine_plusuri;
CREATE DATABASE magazine_plusuri CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE magazine_plusuri;

-- =====================================================
-- TABEL CATEGORII
-- =====================================================
CREATE TABLE categorii (
    id_categorie INT AUTO_INCREMENT PRIMARY KEY,
    nume_categorie VARCHAR(100) NOT NULL UNIQUE,
    descriere TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TABEL UTILIZATORI (cu parole criptate)
-- =====================================================
CREATE TABLE utilizatori (
    id_utilizator INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(150) NOT NULL UNIQUE,
    parola_hash VARCHAR(255) NOT NULL,
    nume_complet VARCHAR(150),
    rol ENUM('client', 'admin') DEFAULT 'client',
    telefon VARCHAR(20),
    adresa VARCHAR(255),
    oras VARCHAR(100),
    cod_postal VARCHAR(10),
    tara VARCHAR(100),
    activ BOOLEAN DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_username (username)
);

-- =====================================================
-- TABEL PRODUSE (fără imagine - imagini în tabel separat)
-- =====================================================
CREATE TABLE produse (
    id_produs INT AUTO_INCREMENT PRIMARY KEY,
    nume_produs VARCHAR(200) NOT NULL,
    descriere LONGTEXT,
    pret_unitar DECIMAL(10, 2) NOT NULL,
    pret_reducere DECIMAL(10, 2),
    stoc INT DEFAULT 0,
    stoc_minim INT DEFAULT 5,
    id_categorie INT,
    culori_disponibile VARCHAR(500),
    timp_livrare_zile INT DEFAULT 7,
    material VARCHAR(100),
    marime VARCHAR(100),
    greutate DECIMAL(6, 2),
    activ BOOLEAN DEFAULT 1,
    vizualizari INT DEFAULT 0,
    rating_mediu DECIMAL(3, 2) DEFAULT 0,
    numar_recenzii INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_categorie) REFERENCES categorii(id_categorie) ON DELETE SET NULL,
    INDEX idx_categorie (id_categorie),
    INDEX idx_activ (activ),
    INDEX idx_pret (pret_unitar)
);

-- =====================================================
-- TABEL IMAGINI PRODUSE (BLOB storage)
-- =====================================================
CREATE TABLE imagini_produse (
    id_imagine INT AUTO_INCREMENT PRIMARY KEY,
    id_produs INT,
    imagine_blob LONGBLOB NOT NULL,
    mime_type VARCHAR(50) DEFAULT 'image/jpeg',
    filename VARCHAR(255),
    descriere VARCHAR(255),
    ordinea INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_produs) REFERENCES produse(id_produs) ON DELETE CASCADE,
    INDEX idx_id_produs (id_produs)
);

-- =====================================================
-- TABEL COS DE CUMPARATURI
-- =====================================================
CREATE TABLE cos_cumparaturi (
    id_cos INT AUTO_INCREMENT PRIMARY KEY,
    id_utilizator INT NOT NULL,
    id_produs INT NOT NULL,
    cantitate INT DEFAULT 1,
    culoare_selectata VARCHAR(100),
    pret_la_moment_adaugare DECIMAL(10, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_utilizator) REFERENCES utilizatori(id_utilizator) ON DELETE CASCADE,
    FOREIGN KEY (id_produs) REFERENCES produse(id_produs) ON DELETE CASCADE,
    UNIQUE KEY unique_cos_item (id_utilizator, id_produs, culoare_selectata),
    INDEX idx_utilizator (id_utilizator)
);

-- =====================================================
-- TABEL COMENZI
-- =====================================================
CREATE TABLE comenzi (
    id_comanda INT AUTO_INCREMENT PRIMARY KEY,
    id_utilizator INT NOT NULL,
    nume_client VARCHAR(150),
    email_client VARCHAR(150),
    telefon_client VARCHAR(20),
    adresa_livrare VARCHAR(255),
    oras_livrare VARCHAR(100),
    cod_postal_livrare VARCHAR(10),
    tara_livrare VARCHAR(100),
    metoda_plata ENUM('card', 'transfer_bancar', 'plata_la_livrare') DEFAULT 'plata_la_livrare',
    status ENUM('in_procesare', 'confirmare', 'in_productie', 'gata_pentru_livrare', 'in_tranzit', 'livrata', 'anulata', 'returnata') DEFAULT 'in_procesare',
    total_produse DECIMAL(10, 2),
    taxa_transport DECIMAL(10, 2) DEFAULT 0,
    taxa_ambalaj DECIMAL(10, 2) DEFAULT 0,
    total DECIMAL(10, 2),
    note_comenzi TEXT,
    note_interne TEXT,
    data_comanda TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_livrare_estimata DATE,
    data_livrare_reala DATE,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_utilizator) REFERENCES utilizatori(id_utilizator) ON DELETE CASCADE,
    INDEX idx_utilizator (id_utilizator),
    INDEX idx_status (status),
    INDEX idx_data (data_comanda)
);

-- =====================================================
-- TABEL DETALII COMANDA
-- =====================================================
CREATE TABLE detalii_comanda (
    id_detaliu INT AUTO_INCREMENT PRIMARY KEY,
    id_comanda INT NOT NULL,
    id_produs INT NOT NULL,
    nume_produs VARCHAR(200),
    cantitate INT NOT NULL,
    pret_unitar DECIMAL(10, 2) NOT NULL,
    culoare_comandata VARCHAR(100),
    subtotal DECIMAL(10, 2),
    FOREIGN KEY (id_comanda) REFERENCES comenzi(id_comanda) ON DELETE CASCADE,
    FOREIGN KEY (id_produs) REFERENCES produse(id_produs),
    INDEX idx_comanda (id_comanda)
);

-- =====================================================
-- TABEL RECENZII/REVIEWS
-- =====================================================
CREATE TABLE recenzii (
    id_recenzie INT AUTO_INCREMENT PRIMARY KEY,
    id_utilizator INT NOT NULL,
    id_produs INT NOT NULL,
    id_comanda INT,
    titlu VARCHAR(200),
    comentariu LONGTEXT,
    rating INT CHECK (rating BETWEEN 1 AND 5),
    fotografie_blob LONGBLOB,
    fotografie_mime VARCHAR(50),
    verifikat_cumparator BOOLEAN DEFAULT 1,
    util_count INT DEFAULT 0,
    status ENUM('in_asteptare', 'aprobata', 'respinsa') DEFAULT 'in_asteptare',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_utilizator) REFERENCES utilizatori(id_utilizator) ON DELETE CASCADE,
    FOREIGN KEY (id_produs) REFERENCES produse(id_produs) ON DELETE CASCADE,
    FOREIGN KEY (id_comanda) REFERENCES comenzi(id_comanda) ON DELETE SET NULL,
    INDEX idx_produs (id_produs),
    INDEX idx_utilizator (id_utilizator),
    INDEX idx_status (status)
);

-- =====================================================
-- TABEL FAVORITE
-- =====================================================
CREATE TABLE favorite (
    id_favorit INT AUTO_INCREMENT PRIMARY KEY,
    id_utilizator INT NOT NULL,
    id_produs INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_utilizator) REFERENCES utilizatori(id_utilizator) ON DELETE CASCADE,
    FOREIGN KEY (id_produs) REFERENCES produse(id_produs) ON DELETE CASCADE,
    UNIQUE KEY unique_favorit (id_utilizator, id_produs),
    INDEX idx_utilizator (id_utilizator)
);

-- =====================================================
-- TABEL TRACING COMENZI (audit trail)
-- =====================================================
CREATE TABLE tracing_comenzi (
    id_trace INT AUTO_INCREMENT PRIMARY KEY,
    id_comanda INT NOT NULL,
    status_anterior VARCHAR(50),
    status_nou VARCHAR(50),
    nota TEXT,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_comanda) REFERENCES comenzi(id_comanda) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES utilizatori(id_utilizator),
    INDEX idx_comanda (id_comanda)
);

-- =====================================================
-- TABEL NOTIFICARI EMAIL
-- =====================================================
CREATE TABLE notificari_email (
    id_notificare INT AUTO_INCREMENT PRIMARY KEY,
    id_utilizator INT,
    email_recipient VARCHAR(150),
    tip_notificare VARCHAR(100), -- 'confirmare_comanda', 'status_actualizare', 'produs_disponibil', etc
    subject VARCHAR(255),
    content_html LONGTEXT,
    trimisa BOOLEAN DEFAULT 0,
    data_trimitere TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_utilizator) REFERENCES utilizatori(id_utilizator) ON DELETE SET NULL,
    INDEX idx_trimisa (trimisa)
);

-- =====================================================
-- POPULARE DATE INITIALE
-- =====================================================

INSERT INTO categorii (nume_categorie, descriere) VALUES
('Plușuri Mici', 'Accesorii și brelocuri croșetate'),
('Plușuri Medii', 'Jucării și decorații de mărime medie'),
('Plușuri Mari', 'Colecții de colecție și decorații mari'),
('Pokemon', 'Personaje Pokemon croșetate'),
('Creaturi Fantastice', 'Dragoni, monstri și alte creaturi');

-- =====================================================
-- INDECSI SUPLIMENTARI PENTRU PERFORMANTA
-- =====================================================

CREATE INDEX idx_comenzi_data ON comenzi(data_comanda);
CREATE INDEX idx_comenzi_status ON comenzi(status);
CREATE INDEX idx_produse_active ON produse(activ, pret_unitar);
CREATE INDEX idx_recenzii_rating ON recenzii(rating);
CREATE INDEX idx_cos_user_date ON cos_cumparaturi(id_utilizator, created_at);

-- =====================================================
-- VIEWS PENTRU RAPOARTE
-- =====================================================

CREATE VIEW v_produse_popular AS
SELECT 
    p.id_produs,
    p.nume_produs,
    p.pret_unitar,
    p.vizualizari,
    p.rating_mediu,
    p.numar_recenzii,
    COUNT(DISTINCT dc.id_comanda) as numar_comenzi
FROM produse p
LEFT JOIN detalii_comanda dc ON p.id_produs = dc.id_produs
WHERE p.activ = 1
GROUP BY p.id_produs
ORDER BY p.vizualizari DESC;

CREATE VIEW v_comenzi_utilizator AS
SELECT 
    u.id_utilizator,
    u.username,
    u.email,
    COUNT(c.id_comanda) as numar_comenzi,
    SUM(c.total) as total_cheltuiti,
    MAX(c.data_comanda) as ultima_comanda
FROM utilizatori u
LEFT JOIN comenzi c ON u.id_utilizator = c.id_utilizator
WHERE c.id_comanda IS NOT NULL
GROUP BY u.id_utilizator;

SELECT * FROM magazine_plusuri.utilizatori;
SELECT * FROM magazine_plusuri.utilizatori ORDER BY id_utilizator DESC LIMIT 5;

