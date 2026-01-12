// =====================================================
// BULK UPLOAD PRODUCTS WITH IMAGES
// =====================================================

const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const IMAGES_DIR = path.join(__dirname, '..', 'Dumitru_Claudia_Stefania', 'images');

const products = [
  { title: "Mini caracatita", price: 35, descriere: "Caracatita micuta crosetata manual, perfecta pentru copii si bebelusi. Timp de lucru: 1h30. Culorile pot varia.", imgs: ["IMG-20251110-WA0039.jpg", "IMG-20251110-WA0040.jpg", "IMG-20251110-WA0042.jpg"] },
  { title: "Iepure Crosetat", price: 200, descriere: "Iepuras pufos crosetat manual, ~9h lucru. Culorile pot varia.", imgs: ["WhatsApp Image 2025-10-05 at 00.33.25_35e0ca27.jpg", "WhatsApp Image 2025-10-05 at 00.33.25_7cb8629f.jpg", "IMG-20251110-WA0118.jpg"] },
  { title: "Testoasa Crosetata", price: 65, descriere: "Testoasa crosetata manual, ~2h30. Culorile pot varia.", imgs: ["IMG-20251110-WA0043.jpg", "IMG-20251110-WA0062.jpg", "IMG-20251110-WA0055.jpg"] },
  { title: "Hamster micut cu fundita breloc", price: 40, descriere: "Hamster crosetat manual, ~1h30. Culorile pot varia.", imgs: ["IMG-20251110-WA0044.jpg", "IMG-20251110-WA0045.jpg", "IMG-20251110-WA0047.jpg"] },
  { title: "Floricele diferite marimi/stiluri", price: 40, descriere: "Pretul variaza in functie de marime si stil. Set de floricele crosetate.", imgs: ["IMG-20251110-WA0046.jpg", "IMG-20251110-WA0048.jpg", "IMG-20251110-WA0049.jpg"] },
  { title: "Axolotl crosetat", price: 80, descriere: "Axolotl crosetat manual, ~2h30. Culorile pot varia.", imgs: ["IMG-20251110-WA0090.jpg", "IMG-20251110-WA0092.jpg", "IMG-20251110-WA0069.jpg", "IMG-20251110-WA0067.jpg"] },
  { title: "Evolutiile lui Eevee", price: 75, descriere: "Evolutii Eevee crosetate manual, ~3h. Culorile pot varia.", imgs: ["IMG-20251110-WA0073.jpg", "IMG-20251110-WA0076.jpg", "IMG-20251110-WA0086.jpg", "IMG-20251110-WA0087.jpg", "IMG-20251110-WA0088.jpg"] },
  { title: "Pokeball crosetat", price: 45, descriere: "Pokeball crosetat, ~1h. Culorile pot varia.", imgs: ["IMG-20251110-WA0091.jpg", "IMG-20251110-WA0089.jpg"] },
  { title: "Pisicuta crosetata", price: 50, descriere: "Pisicuta crosetata, ~2h. Culorile si modelele pot varia.", imgs: ["IMG-20251110-WA0081.jpg", "IMG-20251110-WA0082.jpg", "IMG-20251110-WA0084.jpg"] },
  { title: "Leafeon crosetat mare", price: 1020, descriere: "Leafeon crosetat mare, ~70h. Culorile pot varia.", imgs: ["IMG-20251110-WA0074.jpg", "IMG-20251110-WA0077.jpg", "IMG-20251110-WA0078.jpg", "IMG-20251110-WA0080.jpg"] },
  { title: "Dragon mare crosetat", price: 800, descriere: "Dragon crosetat ~125 cm, ~50h. Coada poate avea modele diferite.", imgs: ["IMG-20251110-WA0083.jpg", "IMG-20251110-WA0070.jpg", "IMG-20251110-WA0071.jpg"] },
  { title: "Red din Angry Birds", price: 75, descriere: "Red Angry Birds crosetat, ~3h.", imgs: ["IMG-20251110-WA0094.jpg", "IMG-20251110-WA0093.jpg", "IMG-20251110-WA0095.jpg"] }
];

async function main() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'magazine_plusuri',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });

  console.log('Connecting to database...');

  try {
    // 1. Create/update admin user
    console.log('\n1. Setting up admin user...');
    const adminUsername = 'admin';
    const adminEmail = 'admin@example.com';
    const adminPassword = 'Admin123!';
    const parola_hash = await bcrypt.hash(adminPassword, 10);

    const [existingAdmin] = await pool.query(
      'SELECT id_utilizator, rol FROM utilizatori WHERE username = ? OR email = ?',
      [adminUsername, adminEmail]
    );

    let adminId;
    if (existingAdmin.length > 0) {
      adminId = existingAdmin[0].id_utilizator;
      console.log(`Admin user exists (ID: ${adminId}), updating to admin role...`);
      await pool.query(
        'UPDATE utilizatori SET rol = ?, parola_hash = ? WHERE id_utilizator = ?',
        ['admin', parola_hash, adminId]
      );
    } else {
      console.log('Creating new admin user...');
      const [result] = await pool.query(
        'INSERT INTO utilizatori (username, email, parola_hash, nume_complet, rol) VALUES (?, ?, ?, ?, ?)',
        [adminUsername, adminEmail, parola_hash, 'Administrator', 'admin']
      );
      adminId = result.insertId;
    }

    console.log(`✓ Admin user ready (ID: ${adminId}, user: ${adminUsername}, pass: ${adminPassword})`);

    // 2. Ensure we have at least one category
    console.log('\n2. Checking categories...');
    const [categories] = await pool.query('SELECT id_categorie FROM categorii LIMIT 1');
    let categoryId;
    if (categories.length === 0) {
      console.log('No categories found, creating default...');
      const [catResult] = await pool.query(
        "INSERT INTO categorii (nume_categorie, descriere) VALUES (?, ?)",
        ['Plușuri Croșetate', 'Diverse plușuri croșetate manual']
      );
      categoryId = catResult.insertId;
    } else {
      categoryId = categories[0].id_categorie;
    }
    console.log(`✓ Using category ID: ${categoryId}`);

    // 3. Upload products with images
    console.log('\n3. Uploading products with images...');
    let successCount = 0;
    let errorCount = 0;

    for (const product of products) {
      try {
        console.log(`\n  Processing: ${product.title}`);
        
        // Insert product
        const [prodResult] = await pool.query(
          `INSERT INTO produse (nume_produs, descriere, pret_unitar, stoc, id_categorie, activ)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [product.title, product.descriere, product.price, 10, categoryId, 1]
        );
        const produsId = prodResult.insertId;
        console.log(`    ✓ Product created (ID: ${produsId})`);

        // Insert images
        let imgCount = 0;
        for (let i = 0; i < product.imgs.length; i++) {
          const imgFile = product.imgs[i];
          const imgPath = path.join(IMAGES_DIR, imgFile);

          if (!fs.existsSync(imgPath)) {
            console.log(`    ⚠ Image not found: ${imgFile}`);
            continue;
          }

          const imgBuffer = fs.readFileSync(imgPath);
          const mimeType = imgFile.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';

          await pool.query(
            'INSERT INTO imagini_produse (id_produs, imagine_blob, mime_type, filename, ordinea) VALUES (?, ?, ?, ?, ?)',
            [produsId, imgBuffer, mimeType, imgFile, i]
          );
          imgCount++;
        }

        console.log(`    ✓ ${imgCount} images uploaded`);
        console.log(`    → API URL: http://localhost:3000/api/produse/${produsId}`);
        successCount++;
      } catch (err) {
        console.error(`    ✗ Error: ${err.message}`);
        errorCount++;
      }
    }

    console.log(`\n✓ Upload complete: ${successCount} products created, ${errorCount} errors`);
    console.log('\nYou can now:');
    console.log('  - Login at http://localhost:3000/api/auth/login with:');
    console.log(`    username: ${adminUsername}`);
    console.log(`    parola: ${adminPassword}`);
    console.log('  - View products at http://localhost:3000/api/produse');
    console.log('  - Use image URLs like: http://localhost:3000/api/produse/{id_produs}/imagini/{id_imagine}');

  } catch (err) {
    console.error('Fatal error:', err);
  } finally {
    await pool.end();
  }
}

main();
