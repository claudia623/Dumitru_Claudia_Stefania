require('dotenv').config();
const mysql = require('mysql2/promise');

async function main(){
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'magazine_plusuri',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });

  const conn = await pool.getConnection();
  try {
    // Resolve demo users
    const [users] = await conn.query("SELECT id_utilizator, username, email FROM utilizatori WHERE username IN ('demo1','demo2','demo3')");
    if(!users.length){ console.log('No demo users found.'); return; }
    const u1 = users.find(u=>u.username==='demo1') || users[0];

    // Fetch some products (ids and price)
    const [products] = await conn.query('SELECT id_produs, nume_produs, pret_unitar FROM produse ORDER BY id_produs LIMIT 3');
    if(!products.length){ console.log('No products found.'); return; }

    // Show columns for cos_cumparaturi to adapt
    const [cosCols] = await conn.query('SHOW COLUMNS FROM cos_cumparaturi');
    const cosFields = cosCols.map(c=>c.Field);
    const hasColor = cosFields.includes('culoare_selectata');
    const hasPriceAtAdd = cosFields.includes('pret_la_moment_adaugare');

    // Insert 2 cart items for demo1
    for(let i=0;i<Math.min(2, products.length); i++){
      const p = products[i];
      const values = [u1.id_utilizator, p.id_produs, 1];
      const cols = ['id_utilizator','id_produs','cantitate'];
      if(hasColor){ cols.push('culoare_selectata'); values.push(null); }
      if(hasPriceAtAdd){ cols.push('pret_la_moment_adaugare'); values.push(p.pret_unitar); }
      const sql = `INSERT INTO cos_cumparaturi (${cols.join(',')}) VALUES (${cols.map(()=>'?').join(',')})`;
      await conn.query(sql, values);
    }
    console.log('Seeded cart items for', u1.username);

    // Create an order for demo1 with two items
    const items = products.slice(0, Math.min(2, products.length)).map(p=>({ id_produs: p.id_produs, nume_produs: p.nume_produs, cantitate: 1, pret_unitar: p.pret_unitar }));
    const total_produse = items.reduce((s,i)=> s + Number(i.pret_unitar) * Number(i.cantitate), 0);
    const taxa_transport = 15;
    const taxa_ambalaj = 5;
    const total = total_produse + taxa_transport + taxa_ambalaj;

    // Insert into comenzi (detect columns)
    const [cmdCols] = await conn.query('SHOW COLUMNS FROM comenzi');
    const cmdFields = cmdCols.map(c=>c.Field);
    const cols = ['id_utilizator','total'];
    const vals = [u1.id_utilizator, total];
    function push(col, val){ if(cmdFields.includes(col)){ cols.push(col); vals.push(val); } }
    push('status', 'livrata');
    push('nume_client', u1.username);
    push('email_client', u1.email);
    push('telefon_client', '0722 000 000');
    push('adresa_livrare', 'Str. Exemplu 1');
    push('oras_livrare', 'Bucuresti');
    push('cod_postal_livrare', '010010');
    push('tara_livrare', 'Romania');
    // metoda_plata valid enum: 'card','transfer_bancar','plata_la_livrare'
    push('metoda_plata', 'plata_la_livrare');
    push('total_produse', total_produse);
    push('taxa_transport', taxa_transport);
    push('taxa_ambalaj', taxa_ambalaj);
    push('note_comenzi', 'Comanda demo seed');

    const insertComandaSQL = `INSERT INTO comenzi (${cols.join(',')}) VALUES (${cols.map(()=>'?').join(',')})`;
    const [cRes] = await conn.query(insertComandaSQL, vals);
    const comandaId = cRes.insertId;

    // Insert detalii_comanda rows (detect columns)
    const [detCols] = await conn.query('SHOW COLUMNS FROM detalii_comanda');
    const detFields = detCols.map(c=>c.Field);
    for(const it of items){
      const detColsUse = ['id_comanda','id_produs','cantitate','pret_unitar'];
      const detValsUse = [comandaId, it.id_produs, it.cantitate, it.pret_unitar];
      if(detFields.includes('nume_produs')){ detColsUse.push('nume_produs'); detValsUse.push(it.nume_produs); }
      if(detFields.includes('subtotal')){ detColsUse.push('subtotal'); detValsUse.push(Number(it.pret_unitar) * Number(it.cantitate)); }
      const detSQL = `INSERT INTO detalii_comanda (${detColsUse.join(',')}) VALUES (${detColsUse.map(()=>'?').join(',')})`;
      await conn.query(detSQL, detValsUse);
    }

    console.log('Seeded one order', comandaId, 'for', u1.username);
  } finally {
    conn.release();
    await pool.end();
  }
}

main().catch(err=>{ console.error('Seed orders/cart error:', err); process.exit(1); });
