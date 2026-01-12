# 🧶 Magazin Plușuri Croșetate - Sistema Completa cu Bază de Date

## 📋 Conținut Pachet

```
Dumitru_Claudia_Stefania/
├── baza de date/
│   ├── schema_completa_cu_imagini.sql    ← Schema bază de date (BLOB + bcrypt)
│   ├── Dumitru_Claudia_Stefania.sql      ← SQL original
│   ├── produse.sql
│   └── recenzii.sql
│
├── backend/
│   ├── server.js                         ← Backend Express server
│   ├── package.json                      ← Dependencies
│   └── .env                              ← Configurare (DB credentials)
│
├── Dumitru_Claudia_Stefania/
│   ├── auth-api.js                       ← Modulul de auth cu API
│   ├── products-api.js                   ← API pentru produse, cos, comenzi
│   │
│   ├── login-api.html                    ← Login conectat la API (NUEVO)
│   ├── cart-api.html                     ← Cos conectat la API (NUEVO)
│   │
│   ├── index.html
│   ├── produse.html
│   ├── product.html
│   ├── contact.html
│   ├── account.html
│   ├── favorites.html
│   ├── orders.html
│   ├── current-order.html
│   │
│   ├── style.css
│   ├── site-ui.js
│   ├── cart.js
│   ├── favorites.js
│   └── products-data.js                  ← (Poate fi păstrat sau migrat la API)
│
├── IMPLEMENTATION_GUIDE.md               ← Ghid complet (EN+RO)
└── README.md                             ← Acest file
```

---

## 🚀 QUICK START (5 MINUTE)

### 1️⃣ **Setup Bază de Date**

```bash
# Deschide MySQL CLI sau Workbench
mysql -u root -p

# Rulează schema SQL
mysql> source "D:/Facultate/An3/Sem 1/TW/Dumitru_Claudia_Stefania/baza de date/schema_completa_cu_imagini.sql"

# Verifică
mysql> USE magazine_plusuri;
mysql> SHOW TABLES;
```

### 2️⃣ **Setup Backend**

```bash
# Navighează la backend folder
cd "D:\Facultate\An3\Sem 1\TW\Dumitru_Claudia_Stefania\backend"

# Instalează dependencies
npm install

# Editează .env cu MySQL credentials
# DB_USER=root
# DB_PASSWORD=your_password
# DB_NAME=magazine_plusuri

# Pornește serverul
npm start
# Server va rula pe http://localhost:3000
```

### 3️⃣ **Test Frontend**

```bash
# Deschide browser la folder frontend
# File → Open → Dumitru_Claudia_Stefania/Dumitru_Claudia_Stefania/index.html

# Sau pornește un local server (de ex. VS Code Live Server)
```

---

## 🔑 CE S-A SCHIMBAT

### ✅ **De LA localStorage PE LA API Backend**

| Feature | Înainte | Acum |
|---------|---------|------|
| Login/Register | localStorage | API JWT + bcrypt |
| Parole | Text plain (UNSAFE!) | bcrypt hashate |
| Produse | Static JSON array | MySQL Database |
| Imagini | Path URLs | BLOB în baza de date |
| Cos | localStorage | Database per user |
| Comenzi | localStorage | Database cu detalii complete |
| Recenzii | JSON file | Database cu moderation |

### 🔒 **Securitate**

- ✅ Parole **criptate bcrypt** (imposibil de recuperat)
- ✅ JWT tokens pentru sesiuni
- ✅ CORS enabled pe backend
- ✅ Validation pe server-side
- ✅ Database queries cu prepared statements (anti-SQL injection)

### 📦 **Imagini**

- ✅ Upload direct în baza de date (BLOB)
- ✅ Nu mai trebuie redenumite manual
- ✅ Suport pentru culori și variante
- ✅ Imagine per produs în database

---

## 📖 DOCUMENTARE COMPLETA

Vezi **IMPLEMENTATION_GUIDE.md** pentru:
- Endpoint API complet
- Exemple de cod JavaScript
- Integrare HTML pages
- Troubleshooting
- Best practices

---

## ⚙️ CONFIGURARE DETALII

### Backend `.env` File

```env
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=magazine_plusuri
JWT_SECRET=super_secret_key_change_in_production_DO_NOT_USE_THIS
NODE_ENV=development
```

### Database Credentials

Schimbă în `.env` daca e diferit:
```
mysql -u root -pTATA
```

---

## 🎯 PRINCIPALELE API ENDPOINTS

```javascript
// AUTENTIFICARE
POST /api/auth/register        → Înregistrare user
POST /api/auth/login           → Login
GET /api/auth/me               → Current user
PUT /api/auth/profil           → Update profil
POST /api/auth/change-password → Schimb parolă

// PRODUSE & IMAGINI
GET /api/produse               → Toate produsele
GET /api/produse/:id           → Detalii produs
GET /api/produse/:id/imagini/:img_id → Imagine BLOB

// COS
GET /api/cos                   → Items cos
POST /api/cos                  → Add to cart
PUT /api/cos/:id               → Update item
DELETE /api/cos/:id            → Remove item

// COMENZI
POST /api/comenzi              → Crează comanda
GET /api/comenzi               → Comenzile userului
GET /api/comenzi/:id           → Detalii comanda

// FAVORITE
GET /api/favorite              → Favorite list
POST /api/favorite/:id         → Add to favorites
DELETE /api/favorite/:id       → Remove from favorites
```

---

## 🛠️ TROUBLESHOOTING

### ❌ "Cannot connect to database"
```bash
# Verifică că MySQL rulează
# Windows:
net start MySQL80

# Linux:
mysql.server start

# Mac:
brew services start mysql
```

### ❌ "CORS Error"
```javascript
// Backend trebuie pornit:
// http://localhost:3000
// Verifică că PORT=3000 în .env
```

### ❌ "npm install fails"
```bash
# Verifica Node.js version
node --version    # Trebuie v12+
npm --version     # Trebuie v6+

# Upgrade Node.js dacă e veche
# Download din https://nodejs.org
```

### ❌ "Imagini nu se afisează"
```javascript
// Check în console browser (F12)
// URL ar trebui ceva de genul:
// http://localhost:3000/api/produse/1/imagini/5

// Verifică că imaginea e uploadată în BD
SELECT COUNT(*) FROM imagini_produse;
```

---

## 📚 RESURSE

- **Express.js**: https://expressjs.com
- **MySQL2/Promise**: https://github.com/sidorares/node-mysql2
- **bcrypt**: https://github.com/kelektiv/node.bcrypt.js
- **JWT**: https://jwt.io
- **Postman** (pentru testing API): https://www.postman.com

---

## 🎓 MIGRARE PAGINI FRONTEND (OPTIONAL)

Deja sunt versiuni noi:
- `login-api.html` - Login cu API
- `cart-api.html` - Cos cu API

Pentru alte pagini, schimbă din:
```javascript
// OLD - localStorage
var products = PRODUCTS;  // static array

// NEW - API calls
productsAPI.getProducts()
  .then(function(products){ ... })
```

---

## 🔒 SIGURANȚA PAROLE

### Înainte (UNSAFE):
```json
{
  "username": "ion",
  "password": "parola123"  // TEXT PLAIN - DANGER!
}
```

### Acum (SECURE):
```
Database:
parola_hash: $2b$10$............................... (256 chars bcrypt hash)

Verificare:
bcrypt.compare("parola123", hash) → true/false
```

Chiar dacă DB e breach-ă, parolele nu pot fi recuperate!

---

## 📊 SCHEMA DATABASE HIGHLIGHTS

```sql
-- Tabel utilizatori cu parole criptate
CREATE TABLE utilizatori (
    id_utilizator INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(150) NOT NULL UNIQUE,
    parola_hash VARCHAR(255) NOT NULL,  ← bcrypt encrypted!
    rol ENUM('client', 'admin') DEFAULT 'client',
    ...
);

-- Imagini stocate ca BLOB
CREATE TABLE imagini_produse (
    id_imagine INT AUTO_INCREMENT PRIMARY KEY,
    id_produs INT,
    imagine_blob LONGBLOB NOT NULL,  ← Image data here
    mime_type VARCHAR(50),
    ...
);

-- Comenzi complete cu tracking
CREATE TABLE comenzi (
    id_comanda INT AUTO_INCREMENT PRIMARY KEY,
    id_utilizator INT NOT NULL,
    status ENUM('in_procesare', 'livrata', ...) DEFAULT 'in_procesare',
    total DECIMAL(10,2),
    data_comanda TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ...
);
```

---

## ✅ TESTING CHECKLIST

- [ ] MySQL conectat și bază de date creată
- [ ] Backend server rulează pe port 3000
- [ ] Register funcționează (parolă criptată)
- [ ] Login funcționează (JWT token generat)
- [ ] Produse se afisează din BD
- [ ] Upload imagini funcționează
- [ ] Cos de cumpărături salvează în DB
- [ ] Comenzi se salvează complet
- [ ] Recenzii apar cu moderation
- [ ] Favorite funcționează

---

## 📞 SUPORT

Dacă ai probleme:

1. **Check console browser** (F12 → Console)
2. **Check terminal backend** pentru errori
3. **Verifică MySQL** este pornit
4. **Verifică .env** cu credentiale corecte
5. **Citeste IMPLEMENTATION_GUIDE.md** pentru detalii

---

## 🎉 GATA!

Ai un sistem complet cu:
- ✅ Bază de date MySQL
- ✅ Parole criptate bcrypt
- ✅ Imagini BLOB
- ✅ Backend API Express
- ✅ JWT authentication
- ✅ Frontend JavaScript modern

**Bucură-te de codul tău! 🚀**

---

**Ultima actualizare:** January 11, 2025  
**Versiune:** 1.0.0
