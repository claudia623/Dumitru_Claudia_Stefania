# 🪟 SETUP PENTRU WINDOWS - Ghid Complet

## ❌ Problema: "mysql is not recognized"

Aceasta înseamnă că MySQL nu e instalat SAU nu e în PATH.

---

## ✅ SOLUȚIE 1: Una-liniara (FASTEST - 30 secunde!)

### Pasul 1: Găsește Serviciul MySQL Corect

**Deschide Command Prompt (Admin) și rulează:**

```bash
sc query | findstr MySQL
```

Aceasta va afișa toate serviciile MySQL instalate pe PC-ul tău. Ar trebui să vezi ceva de genul:
```
SERVICE_NAME: MySQL80
SERVICE_NAME: MySQL57
```

**Notează exact NUMELE serviciului** (ex: MySQL80, MySQL57, MySQL8.0, etc.)

### Pasul 2: Pornește Serviciul

Înlocuiește `MySQL80` cu ce-ai găsit tu:

```bash
net start MySQL80
```

Ar trebui să zică: **"The MySQL80 service has been successfully started."**

### Pasul 3: Execută SQL Script

```bash
mysql -u root -p < "D:\Facultate\An3\Sem 1\TW\Dumitru_Claudia_Stefania\baza de date\schema_completa_cu_imagini.sql"
```

**Apasă Enter de 2 ori** (dacă n-ai parolă MySQL).

**GATA! Database e creat! ✅**

---

## ✅ SOLUȚIE 2: MySQL Workbench (GUI - EASIEST!)

**MySQL nu-i instalat pe PC-ul tău. Hai să folosim Workbench - e mai ușor!**

### Step 1: Instalează MySQL Community

1. Merge la: https://dev.mysql.com/downloads/mysql/
2. Selectează versiunea **8.0** (cea mai nouă)
3. Click **"Download"** (pe rândul cu "Windows (x86, 64-bit)")**
4. Nu trebuie cont - doar click **"No thanks, just start my download"**
5. **Instalează** (next, next, next - acceptă defaults)
6. ⚠️ **IMPORTANT:** Cand te-ntreaba setup-ul:
   - Port: `3306`
   - Root Password: **lasă gol** (apasă Next)
   - Click **Finish**
7. **Reboot PC-ul** (important!)

### Step 2: Instalează MySQL Workbench

1. Merge la: https://dev.mysql.com/downloads/workbench/
2. Download **Workbench** (Windows x86, 64-bit)
3. Instalează (next, next, next)
4. Pornește aplicația

### Step 3: Conectează-te la Local MySQL

1. **Deschide Workbench**
2. Dublu-click pe **"Local instance MySQL80"** (dacă nu apare, click **"+"** și creează)
3. **Hostname:** `localhost`
4. **Port:** `3306`
5. **Username:** `root`
6. **Password:** (lasă gol)
7. Click **"Test Connection"** → Ar trebui **OK**

### Step 4: Execută SQL Script

1. **File → Open SQL Script**
2. **Navighează la:** `D:\Facultate\An3\Sem 1\TW\Dumitru_Claudia_Stefania\baza de date\schema_completa_cu_imagini.sql`
3. Click **Open**
4. Apasă **Ctrl + Shift + Enter** (sau click **⚡ lightning bolt**)
5. **Gata! Database creat! ✅**

Verificare:
```sql
USE magazine_plusuri;
SHOW TABLES;
```
Ar trebui să vezi 10+ tabele.

---

## ✅ SOLUȚIE 2: Pornește MySQL Service + Command Line

### Step 1: Pornește MySQL Service

**Apasă Windows + R**, tastează:
```
services.msc
```

Acolo:
1. **Cauta "MySQL80"** (sau MySQL57, etc. - depinde versiunea)
2. **Click dreapta → Start**
3. Status ar trebui să fie **"Running"**

Alternativ din **Command Prompt (Run as Administrator)**:
```bash
net start MySQL80
# Ar trebui să zică: "The MySQL80 service was successfully started."
```

### Step 2: Deschide MySQL CLI

#### Metoda A: Navigare la folder MySQL

```bash
# Deschide Command Prompt
# Navighează la folder MySQL
cd "C:\Program Files\MySQL\MySQL Server 8.0\bin"

# Conectează-te
mysql -u root -p
# Enter (dacă n-ai parolă, doar apasă Enter)
```

#### Metoda B: Adaugă MySQL la PATH (permanent)

După prima dată o să fii plăcut surprins că merge din orice folder.

**Windows 10/11:**

1. **Apasă Windows Key + X → System**
2. **Click "Advanced system settings" (pe stânga)**
3. **Environment Variables** (jos)
4. **System Variables → Path → Edit**
5. **New**
6. **Paste:** `C:\Program Files\MySQL\MySQL Server 8.0\bin`
7. **OK → OK → OK**
8. **Restart Command Prompt**

Acum:
```bash
mysql -u root -p
```
Ar trebui să merge de oriunde!

### Step 3: Execută SQL Script

```bash
mysql -u root -p
```

Enter parola (gol dacă n-ai).

Apoi în MySQL shell:
```sql
source D:/Facultate/An3/Sem\ 1/TW/Dumitru_Claudia_Stefania/baza\ de\ date/schema_completa_cu_imagini.sql;
```

Sau cu backslash:
```sql
source "D:\\Facultate\\An3\\Sem 1\\TW\\Dumitru_Claudia_Stefania\\baza de date\\schema_completa_cu_imagini.sql";
```

**Gata! ✅**

---

## ❓ Debugging: Verificare Setup

### Check 1: MySQL Service Running?

```bash
# Command Prompt (Admin)
sc query MySQL80
# Ar trebui să zică STATE : 4 RUNNING
```

### Check 2: MySQL CLI funcționează?

```bash
mysql -u root -p
# Ar trebui să intri în mysql>
```

### Check 3: Database creat?

```sql
USE magazine_plusuri;
SHOW TABLES;
# Ar trebui 10+ tabele
```

### Check 4: Path corect?

```bash
where mysql
# Ar trebui să arate path-ul: C:\Program Files\MySQL\...
```

---

## 🔴 Common Windows Errors

### Error 1: "Access Denied for user 'root'@'localhost'"

```
Soluție: Parolă greșită sau MySQL user neconfugurat

Încearcă:
1. mysql -u root (fără -p)
2. Dacă nu merge, resetează parolă:
   https://dev.mysql.com/doc/refman/8.0/en/resetting-permissions.html
```

### Error 2: "Can't connect to MySQL server (111)"

```
Soluție: MySQL service nu rulează

Pornește serviciu:
net start MySQL80

Sau verifică serviciu în Services (services.msc)
```

### Error 3: "Port 3306 already in use"

```
Soluție: Alt MySQL/port deja în folosință

Găsește ce e pe port 3306:
netstat -ano | findstr :3306

Kill procesul (dacă sigur):
taskkill /PID <PID_NUMBER> /F
```

### Error 4: "Can't find file: schema_completa_cu_imagini.sql"

```
Soluție: Path greșit

Folosește full path sau navighează în folder:
mysql -u root -p

mysql> source "D:\\full\\path\\schema_completa_cu_imagini.sql";
```

---

## ⚙️ MySQL Install Path by Version

| Versiune | Path |
|----------|------|
| MySQL 8.0 | `C:\Program Files\MySQL\MySQL Server 8.0\bin` |
| MySQL 5.7 | `C:\Program Files\MySQL\MySQL Server 5.7\bin` |
| MariaDB | `C:\Program Files\MariaDB 10.x\bin` |

---

## 📋 WINDOWS SETUP CHECKLIST

- [ ] MySQL instalat (download din mysql.com)
- [ ] MySQL Service pornit (services.msc sau `net start MySQL80`)
- [ ] MySQL CLI sau Workbench funcționează
- [ ] Conectare la MySQL SUCCESS
- [ ] SQL Script executat
- [ ] 10+ tabele în database magazine_plusuri
- [ ] Backend folder: npm install (următorul step)
- [ ] Backend server pornit: npm start

---

## 🚀 NEXT STEP: BACKEND

Odată ce database-ul e creat, mergi la QUICK_START.md **STEP 2** (Backend Setup).

---

## 💡 PRO TIPS pentru Windows

1. **Deschide PowerShell ca Admin** (mai ușor decât Command Prompt)
2. **Adaugă MySQL la PATH** - save time pe termen lung
3. **Folosește Workbench** - GUI e mai simplu decât CLI
4. **Batch file pentru startup**:
   ```batch
   @echo off
   net start MySQL80
   cd D:\Facultate\...\backend
   npm start
   ```
   Salvează ca `start-server.bat` și double-click = everything starts

5. **Git Bash** - dacă ai Git installed, merge `bash` commands și pe Windows

---

## 📞 HELP - Cloud Database (100% FREE!)

**Dacă PlanetScale cere card, folosește RAILWAY - totally free!**

### Railway (MySQL Cloud) - 5 minute, ZERO card

1. **Merge la:** https://railway.app/
2. **Click "Start Project"**
3. **Selectează "Deploy from GitHub"** (sau "Create New Project")
4. **Click "Provision PostgreSQL"** (sau MySQL dacă e disponibil)
5. **Copy connection string** din "Connect" tab
6. **Paste în `.env`:**
   ```
   DB_CONNECTION=postgresql://user:pass@host:port/dbname
   ```
7. **Execută SQL script** în connection tool
8. **Done! ✅**

---

### Alte Opțiuni GRATUITE (Zero Card):

- **Supabase (PostgreSQL)** - https://supabase.com/
  - Free tier, no credit card
  - Built-in PostgreSQL
  
- **Firebase (NoSQL)** - https://firebase.google.com/
  - Real-time database
  - Zero setup
  
- **Render (PostgreSQL)** - https://render.com/
  - Free tier
  - No credit card required

---

### SAU: Backend cu JSON File (Super Simple!)

Dacă vrei să omiți database-ul pentru acum, backend-ul poate salva data în `data.json`:

```javascript
// server.js va salva users/products în JSON file
// Zero database = zero probleme!
```

**Vrei să merge cu JSON file temporar?** E cea mai rapidă soluție! 🚀

---

### Dacă vrei MySQL local totuși:

1. **Reinstalează MySQL complet:**
   - Control Panel → Uninstall Programs
   - Reboot
   - Download din: https://dev.mysql.com/downloads/mysql/
   - Instalează versiunea **8.0 MSI Installer**
   - Acceptă toate defaults
   - Reboot

2. **WSL (Windows Subsystem for Linux):**
   ```powershell
   wsl --install
   # După reboot, deschide WSL și ruleaza:
   sudo apt install mysql-server
   sudo service mysql start
   mysql -u root < schema.sql
   ```

---

**Succes! 💪**

*Windows setup nu-i ușor, dar odată configurat, merge perfect.*
