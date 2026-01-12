# ⚡ QUICK START - 5 MINUTE SETUP

## 🎯 GOAL
Transforma site-ul static în sistem live cu bază de date, imagini BLOB și parole criptate.

---

## STEP 1️⃣ - SETUP DATABASE (2 minute)

### OPȚIUNE RAPIDĂ: Fără GUI (doar Command Line)

#### 1. Pornește MySQL Service (IMPORTANT!)

**Windows Command Prompt (Run as Administrator):**
```bash
net start MySQL80
```

Ar trebui să vezi:
```
The MySQL80 service is starting.
The MySQL80 service was successfully started.
```

**Dacă ți-e eroare cu MySQL80, încearcă:**
```bash
# Find care versiune ai
sc query | find "MySQL"
# Apoi: net start MySQL57 (sau ce versiune ai)
```

#### 2. Deschide Command Prompt și rulează SQL

```bash
# Deschide Command Prompt (normal, nu admin)
# Merge direct din orice folder

mysql -u root -p < "D:\Facultate\An3\Sem 1\TW\Dumitru_Claudia_Stefania\baza de date\schema_completa_cu_imagini.sql"
```

**Apasă Enter și apoi Enter din nou** (dacă n-ai parolă MySQL, doar apasă Enter)

Ar trebui să vorbească ceva gen:
```
Database created successfully...
Tables created...
```

**Database gata! ✅**

#### 3. Verifică că a funcționat

```bash
mysql -u root -p
# Apasă Enter din nou (parolă gol)
```

Apoi în MySQL shell:
```sql
USE magazine_plusuri;
SHOW TABLES;
```

Ar trebui să vezi 10+ tabele (utilizatori, produse, imagini_produse, etc.)

```sql
exit
```

---

### 🚀 TL;DR (Copy-Paste Solution)

**Deschide Command Prompt și rulează:**

```bash
net start MySQL80
```

Apoi:

```bash
mysql -u root -p < "D:\Facultate\An3\Sem 1\TW\Dumitru_Claudia_Stefania\baza de date\schema_completa_cu_imagini.sql"
```

Apasă Enter de 2 ori (parolă gol).

**Gata! ✅**

---

## ⚠️ Dacă MySQL nu e instalat deloc

**Download și instalează MySQL Community Server:**
- https://dev.mysql.com/downloads/mysql/
- Alege **Windows (x86, 64-bit)**
- Instalează cu default settings
- În instalare selectează să pornească service automat
- Restart PC după instalare
- Poi urmează pași de mai sus

---

## STEP 2️⃣ - SETUP BACKEND (2 minute)

### Terminal - Navighează la backend
```bash
cd "D:\Facultate\An3\Sem 1\TW\Dumitru_Claudia_Stefania\backend"
```

### Instalează dependencies
```bash
npm install
```

### Editează `.env`
```
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=  (lasă gol dacă n-ai parolă)
DB_NAME=magazine_plusuri
JWT_SECRET=super_secret_key_change_in_production
```

### Pornește server
```bash
npm start
```

Ar trebui să vezi:
```
Server running on port 3000
```

✅ Backend online!

---

## STEP 3️⃣ - TEST FRONTEND (1 minute)

### Opțiune A: Drag & Drop în Browser
```
File → Open File → Selectează: 
Dumitru_Claudia_Stefania/login-api.html
```

### Opțiune B: Live Server (dacă ai instalat)
```
Right click pe folder → Open with Live Server
```

### Opțiune C: Python server
```bash
cd Dumitru_Claudia_Stefania
python -m http.server 8000
# Deschide http://localhost:8000
```

✅ Site live!

---

## 🧪 TEST QUICK

### 1. Register
- Mergi la `login-api.html`
- Click "Înregistrează-te aici"
- Crează cont
- Parolă: criptată cu bcrypt ✅

### 2. Login
- Intră cu user nou
- JWT token salvat ✅

### 3. Produse
- Mergi la `produse.html`
- Produse se loadează din MySQL ✅

### 4. Cos
- Click "Adauga in cos"
- Cos se salvează în baza de date ✅

### 5. Upload Admin
- Login ca admin
- Mergi la `admin-add-product.html`
- Drag & drop imagini
- Salvate în BLOB ✅

---

## 📁 FILE STRUCTURE

```
backend/
├── server.js        ← Express API (PORT 3000)
├── package.json     ← npm dependencies
└── .env             ← Database config

Dumitru_Claudia_Stefania/
├── auth-api.js      ← JWT authentication
├── products-api.js  ← API wrapper
├── login-api.html   ← Login cu API
├── cart-api.html    ← Cos cu API
├── admin-add-product.html  ← Upload imagini
└── ... alte pagini

baza de date/
└── schema_completa_cu_imagini.sql  ← MySQL schema
```

---

## 🔒 SECURITY FEATURES

- ✅ **bcrypt Passwords** - Imposibil decrypt
- ✅ **JWT Tokens** - Secure session
- ✅ **BLOB Images** - Nu pe disc
- ✅ **Prepared Statements** - Anti-SQL injection
- ✅ **CORS Enabled** - API protected

---

## ❌ COMMON ISSUES

### "mysql is not recognized" (Windows)

**👉 Citește: WINDOWS_SETUP.md** pentru instrucțiuni complete pentru Windows!

TLDR:
1. Pornește MySQL Service: `net start MySQL80`
2. Folosește MySQL Workbench (GUI - mai ușor)
3. Sau adaugă MySQL la PATH pentru command line

### "Cannot connect to database"
```bash
# Pornește MySQL
mysql.server start  # macOS
net start MySQL80   # Windows
```

### "CORS Error"
```
Check că backend rulează:
http://localhost:3000

Check terminal că nu are errori
```

### "Image not loading"
```
Backend trebuie pornit
Imaginea trebuie uploadată via admin panel
```

### "npm install fails"
```bash
# Upgrade Node.js
# Download din https://nodejs.org

# Sau:
node --version    # trebuie v12+
npm --version     # trebuie v6+
```

---

## 📖 DOCUMENTAȚIE COMPLETĂ

Pentru detalii complete:
- 📘 **IMPLEMENTATION_GUIDE.md** (2000 linii)
- 📙 **SETUP_GUIDE.md** (Full setup)
- 📕 **FINAL_SUMMARY.md** (What's new)

---

## ✅ CHECKLIST

- [ ] MySQL installed și rulează
- [ ] Database creat din SQL file
- [ ] Backend folder cu npm install
- [ ] .env configurat cu DB details
- [ ] Backend server rulează (PORT 3000)
- [ ] Frontend pagini deschid în browser
- [ ] Register/Login funcționează
- [ ] Parole sunt criptate în DB
- [ ] Produse se loadează din MySQL
- [ ] Cos salvează în DB
- [ ] Admin upload imagini funcționează

---

## 🎉 READY!

Backend API: `http://localhost:3000`
Frontend: `file:///D:/...Dumitru_Claudia_Stefania/index.html`

**Enjoy! 🚀**

---

## 💡 NEXT (OPTIONAL)

1. Crează `checkout.html` pentru finalizare comanda
2. Integreaza Stripe pentru plată
3. Setup email notifications
4. Create analytics dashboard
5. Mobile app (React Native)

---

## 📞 HELP

Dacă ai probleme:
1. Check console browser (F12)
2. Check terminal backend
3. Citeste error messages
4. Check IMPLEMENTATION_GUIDE.md
5. Verify .env credentials

**Succes! 💪**
