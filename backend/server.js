// =====================================================
// BACKEND SERVER - MAGAZIN PLUSURI CROSETATE
// Node.js + Express + MySQL + bcrypt
// =====================================================

const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const cors = require('cors');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_change_in_production';
const SALT_ROUNDS = 10;

// =====================================================
// MIDDLEWARE
// =====================================================

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cors({ origin: '*' }));

// Log all requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Simple health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Debug endpoints (development only)
app.get('/api/debug/utilizatori-columns', async (req, res) => {
  try {
    const conn = await pool.getConnection();
    const [rows] = await conn.query('SHOW COLUMNS FROM utilizatori');
    conn.release();
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Eroare server' });
  }
});

app.get('/api/debug/db-version', async (req, res) => {
  try {
    const conn = await pool.getConnection();
    const [rows] = await conn.query('SELECT VERSION() as version');
    conn.release();
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Eroare server' });
  }
});

// Setup multer pentru upload imagini
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Doar imagini sunt permise'));
    }
  }
});

// =====================================================
// CONNECTION POOL MYSQL
// =====================================================

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3307,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_NAME || 'magazine_plusuri',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// =====================================================
// MIDDLEWARE AUTHENTICATION
// =====================================================

const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Token lipsă' });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Token invalid' });
  }
};

const verifyAdmin = (req, res, next) => {
  if (req.user?.rol !== 'admin') {
    return res.status(403).json({ error: 'Acces refuzat - Admin only' });
  }
  next();
};

// =====================================================
// AUTH ENDPOINTS
// =====================================================

// REGISTER
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, parola, nume_complet } = req.body;

    if (!username || !email || !parola) {
      return res.status(400).json({ error: 'Completează toate câmpurile' });
    }

    const conn = await pool.getConnection();

    // Verifica daca user exista
    const [existing] = await conn.query('SELECT id_utilizator FROM utilizatori WHERE username = ? OR email = ?', [username, email]);
    
    if (existing.length > 0) {
      conn.release();
      return res.status(400).json({ error: 'Utilizator sau email deja existent' });
    }

    // Encrypt parola
    const parola_hash = await bcrypt.hash(parola, SALT_ROUNDS);

    // Insert user
    const [result] = await conn.query(
      'INSERT INTO utilizatori (username, email, parola_hash, nume_complet, rol) VALUES (?, ?, ?, ?, ?)',
      [username, email, parola_hash, nume_complet || '', 'client']
    );

    conn.release();

    const user = {
      id_utilizator: result.insertId,
      username,
      email,
      rol: 'client'
    };

    const token = jwt.sign(user, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({ 
      message: 'Înregistrare reușită',
      user,
      token
    });
  } catch (err) {
    console.error('REGISTER error:', err && err.code, err && err.sqlMessage || err && err.message || err);
    res.status(500).json({ error: 'Eroare server' });
  }
});

// LOGIN
app.post('/api/auth/login', async (req, res) => {
  try {
    const { usernameOrEmail, parola } = req.body;

    if (!usernameOrEmail || !parola) {
      return res.status(400).json({ error: 'Completează toți câmpurile' });
    }

    const conn = await pool.getConnection();

    // Detect columns to handle both schema versions
    const [cols] = await conn.query('SHOW COLUMNS FROM utilizatori');
    const fields = cols.map(c => c.Field);
    const passField = fields.includes('parola_hash') ? 'parola_hash' : 'parola';
    const hasActiv = fields.includes('activ');

    let query = `SELECT id_utilizator, username, email, ${passField} as pass, rol FROM utilizatori WHERE (username = ? OR email = ?)`;
    if (hasActiv) query += ' AND activ = 1';

    const [users] = await conn.query(query, [usernameOrEmail, usernameOrEmail]);

    if (users.length === 0) {
      conn.release();
      return res.status(401).json({ error: 'Date de autentificare invalide' });
    }

    const user = users[0];
    
    // Check if password matches (trying both hashed and plain text if needed)
    let paroleMatch = false;
    try {
        paroleMatch = await bcrypt.compare(parola, user.pass);
    } catch(e) {
        // Fallback for plain text passwords in old schema
        paroleMatch = (parola === user.pass);
    }
    
    // Final check - if bcrypt fails it might just be the hash is not a hash
    if (!paroleMatch && parola === user.pass) {
        paroleMatch = true;
    }

    if (!paroleMatch) {
      conn.release();
      return res.status(401).json({ error: 'Date de autentificare invalide' });
    }

    conn.release();

    const userData = {
      id_utilizator: user.id_utilizator,
      username: user.username,
      email: user.email,
      rol: user.rol
    };

    const token = jwt.sign(userData, JWT_SECRET, { expiresIn: '7d' });

    res.json({ 
      message: 'Autentificare reușită',
      user: userData,
      token
    });
  } catch (err) {
    console.error('LOGIN error:', err && err.code, err && err.sqlMessage || err && err.message || err);
    res.status(500).json({ error: 'Eroare server' });
  }
});

// GET CURRENT USER
app.get('/api/auth/me', verifyToken, async (req, res) => {
  try {
    const conn = await pool.getConnection();
    const [users] = await conn.query(
      'SELECT id_utilizator, username, email, nume_complet, rol, telefon, adresa, oras, cod_postal, tara FROM utilizatori WHERE id_utilizator = ?',
      [req.user.id_utilizator]
    );
    conn.release();

    if (users.length === 0) {
      return res.status(404).json({ error: 'Utilizator nu găsit' });
    }

    res.json({ user: users[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Eroare server' });
  }
});

// UPDATE PROFIL
app.put('/api/auth/profil', verifyToken, async (req, res) => {
  try {
    const { nume_complet, telefon, adresa, oras, cod_postal, tara } = req.body;
    const conn = await pool.getConnection();

    await conn.query(
      'UPDATE utilizatori SET nume_complet = ?, telefon = ?, adresa = ?, oras = ?, cod_postal = ?, tara = ? WHERE id_utilizator = ?',
      [nume_complet, telefon, adresa, oras, cod_postal, tara, req.user.id_utilizator]
    );

    conn.release();
    res.json({ message: 'Profil actualizat' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Eroare server' });
  }
});

// CHANGE PASSWORD
app.post('/api/auth/change-password', verifyToken, async (req, res) => {
  try {
    const { parola_veche, parola_noua } = req.body;
    const conn = await pool.getConnection();

    const [users] = await conn.query(
      'SELECT parola_hash FROM utilizatori WHERE id_utilizator = ?',
      [req.user.id_utilizator]
    );

    if (users.length === 0) {
      conn.release();
      return res.status(404).json({ error: 'Utilizator nu găsit' });
    }

    const paroleMatch = await bcrypt.compare(parola_veche, users[0].parola_hash);
    if (!paroleMatch) {
      conn.release();
      return res.status(401).json({ error: 'Parola veche incorectă' });
    }

    const parola_noua_hash = await bcrypt.hash(parola_noua, SALT_ROUNDS);
    await conn.query(
      'UPDATE utilizatori SET parola_hash = ? WHERE id_utilizator = ?',
      [parola_noua_hash, req.user.id_utilizator]
    );

    conn.release();
    res.json({ message: 'Parolă schimbată cu succes' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Eroare server' });
  }
});

// =====================================================
// PRODUSE ENDPOINTS
// =====================================================

// GET TOATE PRODUSELE
app.get('/api/produse', async (req, res) => {
  try {
    const { id_categorie, search, page = 1, limit = 20 } = req.query;
    const conn = await pool.getConnection();
    
    // Check if activ column exists
    const [cols] = await conn.query('SHOW COLUMNS FROM produse');
    const fields = cols.map(c => c.Field);
    const hasActiv = fields.includes('activ');

    let query = 'SELECT * FROM produse WHERE 1=1';
    if (hasActiv) query += ' AND activ = 1';
    
    let params = [];

    if (id_categorie) {
      query += ' AND id_categorie = ?';
      params.push(id_categorie);
    }

    if (search) {
      query += ' AND (nume_produs LIKE ? OR descriere LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY id_produs DESC LIMIT ? OFFSET ?';
    const offset = (page - 1) * limit;
    params.push(parseInt(limit), parseInt(offset));

    const [produse] = await conn.query(query, params);

    // Get images for each product (only if table exists)
    const [tables] = await conn.query("SHOW TABLES LIKE 'imagini_produse'");
    if (tables.length > 0) {
      for (let produs of produse) {
        const [imagini] = await conn.query(
          'SELECT id_imagine, mime_type, ordinea FROM imagini_produse WHERE id_produs = ? ORDER BY ordinea',
          [produs.id_produs]
        );
        produs.imagini = imagini;
      }
    }

    conn.release();
    res.json(produse);
  } catch (err) {
    console.error('API PRODUSE ERROR:', err);
    res.status(500).json({ error: 'Eroare server la preluarea produselor' });
  }
});

// GET PRODUS BY ID
app.get('/api/produse/:id', async (req, res) => {
  try {
    const conn = await pool.getConnection();

    // Get produs
    const [produse] = await conn.query(
      'SELECT * FROM produse WHERE id_produs = ? AND activ = 1',
      [req.params.id]
    );

    if (produse.length === 0) {
      conn.release();
      return res.status(404).json({ error: 'Produs nu găsit' });
    }

    const produs = produse[0];

    // Get imagini
    const [imagini] = await conn.query(
      'SELECT id_imagine, mime_type, ordinea FROM imagini_produse WHERE id_produs = ? ORDER BY ordinea',
      [req.params.id]
    );
    produs.imagini = imagini;

    // Get recenzii (compatibilitate cu schema actuală)
    // Determine created date column name in recenzii
    const [recCols] = await conn.query('SHOW COLUMNS FROM recenzii');
    const recFields = recCols.map(c => c.Field);
    const createdCol = recFields.includes('created_at') ? 'created_at' : (recFields.includes('data') ? 'data' : null);
    const createdSelect = createdCol ? `r.${createdCol} AS created_at` : `NOW() AS created_at`;
    const orderByCreated = createdCol ? `ORDER BY r.${createdCol} DESC` : '';

    const [recenziiRows] = await conn.query(
      `SELECT r.id_recenzie, r.comentariu, r.rating, ${createdSelect}, u.username, u.nume_complet
       FROM recenzii r
       JOIN utilizatori u ON r.id_utilizator = u.id_utilizator
       WHERE r.id_produs = ?
       ${orderByCreated} LIMIT 10`,
      [req.params.id]
    );
    // Mapăm la structura așteptată de frontend (reviews)
    produs.reviews = recenziiRows.map(r => ({
      author: r.nume_complet || r.username || 'Anonim',
      rating: r.rating,
      text: r.comentariu,
      created_at: r.created_at
    }));

    // Update vizualizari
    await conn.query('UPDATE produse SET vizualizari = vizualizari + 1 WHERE id_produs = ?', [req.params.id]);

    conn.release();
    res.json(produs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Eroare server' });
  }
});

// GET IMAGINE PRODUS
app.get('/api/produse/:id/imagini/:id_imagine', async (req, res) => {
  try {
    const conn = await pool.getConnection();
    const [imagini] = await conn.query(
      'SELECT imagine_blob, mime_type FROM imagini_produse WHERE id_imagine = ? AND id_produs = ?',
      [req.params.id_imagine, req.params.id]
    );
    conn.release();

    if (imagini.length === 0) {
      return res.status(404).json({ error: 'Imagine nu găsită' });
    }

    const imagine = imagini[0];
    res.set('Content-Type', imagine.mime_type);
    res.send(imagine.imagine_blob);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Eroare server' });
  }
});

// ADD PRODUS (ADMIN)
app.post('/api/produse', verifyToken, verifyAdmin, upload.array('imagini', 10), async (req, res) => {
  try {
    const { 
      nume_produs, descriere, pret_unitar, pret_reducere, stoc, 
      id_categorie, culori_disponibile, timp_livrare_zile, 
      material, marime, greutate 
    } = req.body;

    const conn = await pool.getConnection();

    // Verificăm coloanele disponibile în tabela produse
    const [cols] = await conn.query('SHOW COLUMNS FROM produse');
    const fields = cols.map(c => c.Field);
    
    const hasPretUnitar = fields.includes('pret_unitar');
    const hasGreutate = fields.includes('greutate');
    const hasMaterial = fields.includes('material');
    const hasMarime = fields.includes('marime');

    // Construim query-ul dinamic în funcție de structura tabelei utilizatorului
    let queryFields = ['nume_produs', 'descriere', 'stoc', 'id_categorie'];
    let queryValues = [nume_produs, descriere, stoc || 0, id_categorie || null];
    let placeholders = ['?', '?', '?', '?'];

    if (hasPretUnitar) {
      queryFields.push('pret_unitar', 'pret_reducere');
      queryValues.push(pret_unitar, pret_reducere || null);
      placeholders.push('?', '?');
    } else if (fields.includes('pret')) {
      queryFields.push('pret');
      queryValues.push(pret_unitar);
      placeholders.push('?');
    }

    if (hasGreutate) { queryFields.push('greutate'); queryValues.push(greutate || null); placeholders.push('?'); }
    if (hasMaterial) { queryFields.push('material'); queryValues.push(material || null); placeholders.push('?'); }
    if (hasMarime) { queryFields.push('marime'); queryValues.push(marime || null); placeholders.push('?'); }
    if (fields.includes('culori_disponibile')) { queryFields.push('culori_disponibile'); queryValues.push(culori_disponibile || null); placeholders.push('?'); }
    if (fields.includes('timp_livrare_zile')) { queryFields.push('timp_livrare_zile'); queryValues.push(timp_livrare_zile || 7); placeholders.push('?'); }

    const sql = `INSERT INTO produse (${queryFields.join(', ')}) VALUES (${placeholders.join(', ')})`;
    const [result] = await conn.query(sql, queryValues);

    const produs_id = result.insertId;

    // Verificăm dacă există tabela de imagini (imagini_produse)
    const [tables] = await conn.query("SHOW TABLES LIKE 'imagini_produse'");
    if (tables.length > 0 && req.files && req.files.length > 0) {
      for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i];
        await conn.query(
          'INSERT INTO imagini_produse (id_produs, imagine_blob, mime_type, filename, ordinea) VALUES (?, ?, ?, ?, ?)',
          [produs_id, file.buffer, file.mimetype, file.originalname, i]
        );
      }
    } else if (fields.includes('imagine') && req.files && req.files.length > 0) {
      // Dacă există doar coloana 'imagine' în tabela produse (schema veche)
      // Salvăm doar numele/referința (sau putem implementa salvare pe disc, dar aici avem BLOB în rest)
      await conn.query('UPDATE produse SET imagine = ? WHERE id_produs = ?', [req.files[0].originalname, produs_id]);
    }

    conn.release();
    res.status(201).json({ message: 'Produs adăugat cu succes', id_produs: produs_id });
  } catch (err) {
    console.error('--- ADD PRODUCT ERROR STACK ---');
    console.error(err);
    console.error('--------------------------------');
    res.status(500).json({ error: 'Eroare server la adăugarea produsului: ' + err.message });
  }
});

// UPDATE PRODUS (ADMIN)
app.put('/api/produse/:id', verifyToken, verifyAdmin, upload.array('imagini_noi', 10), async (req, res) => {
  try {
    const { nume_produs, descriere, pret_unitar, pret_reducere, stoc, id_categorie } = req.body;

    const conn = await pool.getConnection();

    await conn.query(
      `UPDATE produse SET nume_produs = ?, descriere = ?, pret_unitar = ?, pret_reducere = ?, stoc = ?, id_categorie = ? WHERE id_produs = ?`,
      [nume_produs, descriere, pret_unitar, pret_reducere || null, stoc, id_categorie || null, req.params.id]
    );

    // Insert noi imagini daca exista
    if (req.files && req.files.length > 0) {
      const [maxOrder] = await conn.query('SELECT MAX(ordinea) as max_ord FROM imagini_produse WHERE id_produs = ?', [req.params.id]);
      let nextOrder = (maxOrder[0].max_ord || -1) + 1;

      for (let file of req.files) {
        await conn.query(
          'INSERT INTO imagini_produse (id_produs, imagine_blob, mime_type, filename, ordinea) VALUES (?, ?, ?, ?, ?)',
          [req.params.id, file.buffer, file.mimetype, file.originalname, nextOrder++]
        );
      }
    }

    conn.release();
    res.json({ message: 'Produs actualizat' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Eroare server' });
  }
});

// DELETE PRODUS (ADMIN)
app.delete('/api/produse/:id', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const conn = await pool.getConnection();
    await conn.query('UPDATE produse SET activ = 0 WHERE id_produs = ?', [req.params.id]);
    conn.release();
    res.json({ message: 'Produs șters' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Eroare server' });
  }
});

// =====================================================
// COS DE CUMPARATURI
// =====================================================

// GET COS
app.get('/api/cos', verifyToken, async (req, res) => {
  try {
    const conn = await pool.getConnection();

    const [items] = await conn.query(
      `SELECT cc.id_cos, cc.id_produs, cc.cantitate, cc.culoare_selectata, cc.pret_la_moment_adaugare,
              p.nume_produs, p.pret_unitar
       FROM cos_cumparaturi cc
       JOIN produse p ON cc.id_produs = p.id_produs
       WHERE cc.id_utilizator = ?
       ORDER BY cc.created_at DESC`,
      [req.user.id_utilizator]
    );

    // Get imagini pentru fiecare produs din cos
    for (let item of items) {
      const [imagini] = await conn.query(
        'SELECT id_imagine FROM imagini_produse WHERE id_produs = ? ORDER BY ordinea LIMIT 1',
        [item.id_produs]
      );
      item.imagine_id = imagini.length > 0 ? imagini[0].id_imagine : null;
    }

    conn.release();
    res.json(items);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Eroare server' });
  }
});

// ADD TO COS
app.post('/api/cos', verifyToken, async (req, res) => {
  try {
    const { id_produs, cantitate, culoare_selectata } = req.body;
    const conn = await pool.getConnection();

    // Get pret curent
    const [produse] = await conn.query('SELECT pret_unitar FROM produse WHERE id_produs = ?', [id_produs]);
    if (produse.length === 0) {
      conn.release();
      return res.status(404).json({ error: 'Produs nu găsit' });
    }

    // Verifica daca deja in cos
    const [existing] = await conn.query(
      'SELECT id_cos, cantitate FROM cos_cumparaturi WHERE id_utilizator = ? AND id_produs = ? AND culoare_selectata = ?',
      [req.user.id_utilizator, id_produs, culoare_selectata || null]
    );

    if (existing.length > 0) {
      // Update cantitate
      await conn.query(
        'UPDATE cos_cumparaturi SET cantitate = cantitate + ? WHERE id_cos = ?',
        [cantitate || 1, existing[0].id_cos]
      );
    } else {
      // Insert nou
      await conn.query(
        'INSERT INTO cos_cumparaturi (id_utilizator, id_produs, cantitate, culoare_selectata, pret_la_moment_adaugare) VALUES (?, ?, ?, ?, ?)',
        [req.user.id_utilizator, id_produs, cantitate || 1, culoare_selectata || null, produse[0].pret_unitar]
      );
    }

    conn.release();
    res.json({ message: 'Produs adăugat în cos' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Eroare server' });
  }
});

// UPDATE COS ITEM
app.put('/api/cos/:id', verifyToken, async (req, res) => {
  try {
    const { cantitate } = req.body;
    const conn = await pool.getConnection();

    if (cantitate <= 0) {
      await conn.query('DELETE FROM cos_cumparaturi WHERE id_cos = ? AND id_utilizator = ?', [req.params.id, req.user.id_utilizator]);
    } else {
      await conn.query(
        'UPDATE cos_cumparaturi SET cantitate = ? WHERE id_cos = ? AND id_utilizator = ?',
        [cantitate, req.params.id, req.user.id_utilizator]
      );
    }

    conn.release();
    res.json({ message: 'Cos actualizat' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Eroare server' });
  }
});

// DELETE COS ITEM
app.delete('/api/cos/:id', verifyToken, async (req, res) => {
  try {
    const conn = await pool.getConnection();
    await conn.query('DELETE FROM cos_cumparaturi WHERE id_cos = ? AND id_utilizator = ?', [req.params.id, req.user.id_utilizator]);
    conn.release();
    res.json({ message: 'Produs șters din cos' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Eroare server' });
  }
});

// CLEAR COS
app.delete('/api/cos', verifyToken, async (req, res) => {
  try {
    const conn = await pool.getConnection();
    await conn.query('DELETE FROM cos_cumparaturi WHERE id_utilizator = ?', [req.user.id_utilizator]);
    conn.release();
    res.json({ message: 'Cos golit' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Eroare server' });
  }
});

// =====================================================
// COMENZI
// =====================================================

// CREATE COMANDA
app.post('/api/comenzi', verifyToken, async (req, res) => {
  try {
    const { nume_client, email_client, telefon_client, adresa_livrare, oras_livrare, cod_postal_livrare, tara_livrare, metoda_plata, note } = req.body;

    const conn = await pool.getConnection();

    // Get cos items
    const [cos_items] = await conn.query(
      `SELECT cc.id_produs, cc.cantitate, cc.culoare_selectata, p.pret_unitar, p.nume_produs
       FROM cos_cumparaturi cc
       JOIN produse p ON cc.id_produs = p.id_produs
       WHERE cc.id_utilizator = ?`,
      [req.user.id_utilizator]
    );

    if (cos_items.length === 0) {
      conn.release();
      return res.status(400).json({ error: 'Cosul este gol' });
    }

    // Calculate total
    let total_produse = 0;
    for (let item of cos_items) {
      total_produse += item.pret_unitar * item.cantitate;
    }

    const taxa_transport = 15;
    const taxa_ambalaj = 5;
    const total = total_produse + taxa_transport + taxa_ambalaj;

    // Insert comanda
    const [result] = await conn.query(
      `INSERT INTO comenzi (id_utilizator, nume_client, email_client, telefon_client, adresa_livrare, oras_livrare, cod_postal_livrare, tara_livrare, metoda_plata, total_produse, taxa_transport, taxa_ambalaj, total, note_comenzi)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id_utilizator, nume_client, email_client, telefon_client, adresa_livrare, oras_livrare, cod_postal_livrare, tara_livrare, metoda_plata, total_produse, taxa_transport, taxa_ambalaj, total, note]
    );

    const comanda_id = result.insertId;

    // Insert detalii comanda
    for (let item of cos_items) {
      await conn.query(
        `INSERT INTO detalii_comanda (id_comanda, id_produs, nume_produs, cantitate, pret_unitar, culoare_comandata, subtotal)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [comanda_id, item.id_produs, item.nume_produs, item.cantitate, item.pret_unitar, item.culoare_selectata, item.pret_unitar * item.cantitate]
      );

      // Update stoc
      await conn.query(
        'UPDATE produse SET stoc = stoc - ? WHERE id_produs = ?',
        [item.cantitate, item.id_produs]
      );
    }

    // Clear cos
    await conn.query('DELETE FROM cos_cumparaturi WHERE id_utilizator = ?', [req.user.id_utilizator]);

    conn.release();
    res.status(201).json({ message: 'Comanda creată', id_comanda: comanda_id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Eroare server' });
  }
});

// GET COMENZI USER
app.get('/api/comenzi', verifyToken, async (req, res) => {
  try {
    const conn = await pool.getConnection();

    const [comenzi] = await conn.query(
      `SELECT c.id_comanda, c.data_comanda, c.status, c.total, c.adresa_livrare, c.oras_livrare, c.data_livrare_estimata
       FROM comenzi c
       WHERE c.id_utilizator = ?
       ORDER BY c.data_comanda DESC`,
      [req.user.id_utilizator]
    );

    conn.release();
    res.json(comenzi);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Eroare server' });
  }
});

// GET COMANDA DETALII
app.get('/api/comenzi/:id', verifyToken, async (req, res) => {
  try {
    const conn = await pool.getConnection();

    const [comenzi] = await conn.query(
      'SELECT * FROM comenzi WHERE id_comanda = ? AND id_utilizator = ?',
      [req.params.id, req.user.id_utilizator]
    );

    if (comenzi.length === 0) {
      conn.release();
      return res.status(404).json({ error: 'Comanda nu găsită' });
    }

    const [detalii] = await conn.query(
      'SELECT * FROM detalii_comanda WHERE id_comanda = ?',
      [req.params.id]
    );

    conn.release();
    res.json({ comanda: comenzi[0], detalii });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Eroare server' });
  }
});

// =====================================================
// RECENZII
// =====================================================

// ADD RECENZIE
app.post('/api/recenzii', verifyToken, async (req, res) => {
  try {
    const { id_produs, titlu, comentariu, rating } = req.body;

    if (!id_produs || !rating || (rating < 1 || rating > 5)) {
      return res.status(400).json({ error: 'Date invalide' });
    }

    const conn = await pool.getConnection();

    // Verifica daca user a cumparat produsul
    const [achizitii] = await conn.query(
      `SELECT COUNT(*) as count FROM detalii_comanda dc
       JOIN comenzi c ON dc.id_comanda = c.id_comanda
       WHERE c.id_utilizator = ? AND dc.id_produs = ? AND c.status IN ('livrata', 'in_tranzit')`,
      [req.user.id_utilizator, id_produs]
    );

    if (achizitii[0].count === 0) {
      conn.release();
      return res.status(403).json({ error: 'Trebuie să cumperi produsul pentru a face recenzie' });
    }

    // Insert recenzie
    const [result] = await conn.query(
      `INSERT INTO recenzii (id_utilizator, id_produs, titlu, comentariu, rating, status)
       VALUES (?, ?, ?, ?, ?, 'in_asteptare')`,
      [req.user.id_utilizator, id_produs, titlu, comentariu, rating]
    );

    // Update rating mediu produs
    const [ratings] = await conn.query(
      'SELECT AVG(rating) as avg_rating, COUNT(*) as count FROM recenzii WHERE id_produs = ? AND status = "aprobata"',
      [id_produs]
    );

    await conn.query(
      'UPDATE produse SET rating_mediu = ?, numar_recenzii = ? WHERE id_produs = ?',
      [ratings[0].avg_rating || 0, ratings[0].count, id_produs]
    );

    conn.release();
    res.status(201).json({ message: 'Recenzie adăugată, în așteptare de aprobare' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Eroare server' });
  }
});

// GET RECENZII PRODUS
app.get('/api/produse/:id/recenzii', async (req, res) => {
  try {
    const conn = await pool.getConnection();
    // Determine created date column name
    const [recCols] = await conn.query('SHOW COLUMNS FROM recenzii');
    const recFields = recCols.map(c => c.Field);
    const createdCol = recFields.includes('created_at') ? 'created_at' : (recFields.includes('data') ? 'data' : null);
    const createdSelect = createdCol ? `r.${createdCol} AS created_at` : `NOW() AS created_at`;
    const orderByCreated = createdCol ? `ORDER BY r.${createdCol} DESC` : '';

    const [recenzii] = await conn.query(
      `SELECT r.id_recenzie, r.comentariu, r.rating, ${createdSelect}, u.username, u.nume_complet
       FROM recenzii r
       JOIN utilizatori u ON r.id_utilizator = u.id_utilizator
       WHERE r.id_produs = ?
       ${orderByCreated}`,
      [req.params.id]
    );

    conn.release();
    res.json(recenzii.map(r => ({
      id_recenzie: r.id_recenzie,
      author: r.nume_complet || r.username || 'Anonim',
      rating: r.rating,
      text: r.comentariu,
      created_at: r.created_at
    })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Eroare server' });
  }
});

// =====================================================
// FAVORITE
// =====================================================

// GET FAVORITE
app.get('/api/favorite', verifyToken, async (req, res) => {
  try {
    const conn = await pool.getConnection();

    const [favorite] = await conn.query(
      `SELECT f.id_favorit, f.id_produs, p.nume_produs, p.pret_unitar, p.rating_mediu
       FROM favorite f
       JOIN produse p ON f.id_produs = p.id_produs
       WHERE f.id_utilizator = ?`,
      [req.user.id_utilizator]
    );

    conn.release();
    res.json(favorite);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Eroare server' });
  }
});

// ADD FAVORITE
app.post('/api/favorite/:id_produs', verifyToken, async (req, res) => {
  try {
    const conn = await pool.getConnection();

    await conn.query(
      'INSERT IGNORE INTO favorite (id_utilizator, id_produs) VALUES (?, ?)',
      [req.user.id_utilizator, req.params.id_produs]
    );

    conn.release();
    res.json({ message: 'Adăugat la favorite' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Eroare server' });
  }
});

// REMOVE FAVORITE
app.delete('/api/favorite/:id_produs', verifyToken, async (req, res) => {
  try {
    const conn = await pool.getConnection();

    await conn.query(
      'DELETE FROM favorite WHERE id_utilizator = ? AND id_produs = ?',
      [req.user.id_utilizator, req.params.id_produs]
    );

    conn.release();
    res.json({ message: 'Șters din favorite' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Eroare server' });
  }
});

// CHECK FAVORITE
app.get('/api/favorite/check/:id_produs', verifyToken, async (req, res) => {
  try {
    const conn = await pool.getConnection();

    const [favorite] = await conn.query(
      'SELECT id_favorit FROM favorite WHERE id_utilizator = ? AND id_produs = ?',
      [req.user.id_utilizator, req.params.id_produs]
    );

    conn.release();
    res.json({ isFavorite: favorite.length > 0 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Eroare server' });
  }
});

// =====================================================
// CATEGORII
// =====================================================

app.get('/api/categorii', async (req, res) => {
  try {
    const conn = await pool.getConnection();
    const [categorii] = await conn.query('SELECT * FROM categorii ORDER BY nume_categorie');
    conn.release();
    res.json(categorii);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Eroare server' });
  }
});

// =====================================================
// NEWSLETTER
// =====================================================

app.post('/api/newsletter/subscribe', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email necesar' });
    
    const conn = await pool.getConnection();
    await conn.query('INSERT IGNORE INTO newsletter_subscribers (email) VALUES (?)', [email]);
    conn.release();
    res.json({ message: 'Te-ai abonat cu succes!' });
  } catch (err) {
    // Dacă tabelul nu există, îl creăm on-the-fly (pentru simplitate în demo)
    if (err.code === 'ER_NO_SUCH_TABLE') {
      const conn = await pool.getConnection();
      await conn.query('CREATE TABLE IF NOT EXISTS newsletter_subscribers (id INT AUTO_INCREMENT PRIMARY KEY, email VARCHAR(255) UNIQUE, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)');
      await conn.query('INSERT IGNORE INTO newsletter_subscribers (email) VALUES (?)', [req.body.email]);
      conn.release();
      return res.json({ message: 'Te-ai abonat cu succes!' });
    }
    console.error(err);
    res.status(500).json({ error: 'Eroare server' });
  }
});

// CONTACT FORM
// =====================================================

app.post('/api/contact', async (req, res) => {
  try {
    const { nume, email, mesaj } = req.body;
    if (!nume || !email || !mesaj) {
      return res.status(400).json({ error: 'Toate câmpurile sunt obligatorii' });
    }

    const conn = await pool.getConnection();
    
    // Asigură-te că tabelul există (on-the-fly pentru demo)
    await conn.query(`
      CREATE TABLE IF NOT EXISTS contact_mesaje (
        id_mesaj INT AUTO_INCREMENT PRIMARY KEY,
        nume VARCHAR(150) NOT NULL,
        email VARCHAR(150) NOT NULL,
        mesaj TEXT NOT NULL,
        data_trimitere TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await conn.query(
      'INSERT INTO contact_mesaje (nume, email, mesaj) VALUES (?, ?, ?)',
      [nume, email, mesaj]
    );

    conn.release();
    res.json({ message: 'Mesajul tău a fost trimis! Îți vom răspunde cât mai curând.' });
  } catch (err) {
    console.error('CONTACT ERROR:', err);
    res.status(500).json({ error: 'Eroare server la trimiterea mesajului' });
  }
});

// =====================================================
// START SERVER
// =====================================================

app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  try {
    const conn = await pool.getConnection();
    console.log('Successfully connected to MySQL Database on port 3307');
    conn.release();
  } catch (err) {
    console.error('DATABASE CONNECTION ERROR:', err.message);
  }
});

module.exports = app;
