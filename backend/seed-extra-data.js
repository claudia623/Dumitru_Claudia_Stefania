require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

async function main(){
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_NAME || 'magazine_plusuri',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });

  console.log('Connected to DB');

  // Inspect utilizatori table structure for compatibility
  const [userCols] = await pool.query('DESCRIBE utilizatori');
  console.log('utilizatori columns:', userCols.map(c => c.Field));

  // Ensure demo users exist
  const demoUsers = [
    { username: 'demo1', email: 'demo1@example.com', nume_utilizator: 'Demo One', parola: 'Demo123!' },
    { username: 'demo2', email: 'demo2@example.com', nume_utilizator: 'Demo Two', parola: 'Demo123!' },
    { username: 'demo3', email: 'demo3@example.com', nume_utilizator: 'Demo Three', parola: 'Demo123!' },
  ];

  async function ensureUser(u){
    const [rows] = await pool.query('SELECT id_utilizator FROM utilizatori WHERE username=?', [u.username]);
    if(rows.length){ return rows[0].id_utilizator; }
    const hash = await bcrypt.hash(u.parola, 10);
    // Support both parola/parola_hash and name field variations
    const fields = userCols.map(c => c.Field);
    const hasParolaHash = fields.includes('parola_hash');
    const hasParola = fields.includes('parola');
    const nameField = fields.includes('nume_utilizator') ? 'nume_utilizator' : (fields.includes('nume') ? 'nume' : (fields.includes('nume_complet') ? 'nume_complet' : null));
    if(!nameField){ throw new Error('Cannot detect name field in utilizatori table'); }
    const insertSql = `INSERT INTO utilizatori (${nameField}, email, username, ${hasParolaHash ? 'parola_hash' : 'parola'}, rol) VALUES (?,?,?,?,?)`;
    const [res] = await pool.query(insertSql, [u.nume_utilizator, u.email, u.username, hasParolaHash ? hash : u.parola, 'client']);
    return res.insertId;
  }

  const userIds = [];
  for(const u of demoUsers){
    const id = await ensureUser(u);
    userIds.push(id);
  }
  console.log('Demo users ready:', userIds);

  // Fetch products
  const [products] = await pool.query('SELECT id_produs, nume_produs, pret_unitar FROM produse ORDER BY id_produs');
  if(products.length === 0){
    console.log('No products found. Aborting reviews seed.');
    return;
  }
  console.log('Found products:', products.length);

  // Seed reviews: 2 reviews per product from rotating demo users
  const comments = [
    'Produsul este realizat cu mare atenție, recomand!',
    'Arată mai bine decât în poze, foarte mulțumit!',
    'Calitate excelentă, se vede că este lucrat manual.',
    'Livrare rapidă, comunicare foarte bună.',
    'Plușul este foarte pufos și drăguț!',
  ];

  let inserted = 0;
  for(const p of products){
    const toInsert = [
      { userId: userIds[(p.id_produs + 0) % userIds.length], rating: 5, text: comments[(p.id_produs + 0) % comments.length] },
      { userId: userIds[(p.id_produs + 1) % userIds.length], rating: 4, text: comments[(p.id_produs + 1) % comments.length] },
    ];
    for(const r of toInsert){
      await pool.query(
        'INSERT INTO recenzii (id_utilizator, id_produs, comentariu, rating) VALUES (?,?,?,?)',
        [r.userId, p.id_produs, r.text, r.rating]
      );
      inserted++;
    }
  }
  console.log(`Inserted ${inserted} reviews.`);

  await pool.end();
  console.log('Done');
}

main().catch(err => { console.error('Seed error:', err); process.exit(1); });
