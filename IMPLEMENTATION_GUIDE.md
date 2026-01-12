# 🎯 GHID COMPLET - Transformare la Sistem cu Bază de Date

## 📋 OVERVIEW

Proiectul a fost restructurat complet pentru a utiliza o bază de date MySQL cu backend Node.js/Express. Tot conținutul site-ului (produse, imagini, utilizatori, comenzi) este acum stocat în baza de date.

---

## 🗄️ BAZA DE DATE

### Fișier SQL: `schema_completa_cu_imagini.sql`

**Caracteristici principale:**

1. **Utilizatori cu Parole Criptate (bcrypt)**
   - `parola_hash` - parolele sunt criptate cu bcrypt salt10
   - Imposibil de recuperat din baza de date chiar dacă e compromise
   - Verificare prin comparație hash, nu stocaj text plain

2. **Imagini Stocate în BLOB**
   - Tabel `imagini_produse` cu `imagine_blob LONGBLOB`
   - Nu mai e nevoie să schimbi nume de fișiere
   - Upload direct în bază de date

3. **Tabele Principale:**
   ```
   categorii          - Categorii de produse
   produse            - Informații produse
   imagini_produse    - Imagini BLOB pentru produse
   utilizatori        - Conturi cu parole criptate
   cos_cumparaturi    - Coș de cumpărături
   comenzi            - Comenzi complete
   detalii_comanda    - Liniile comenzilor
   recenzii           - Review-uri cu verificare
   favorite           - Lista de favorite
   ```

### Instalare Bază de Date:

```bash
# 1. Deschide MySQL Workbench sau CLI
mysql -u root -p

# 2. Execută script-ul
source "d:/Facultate/An3/Sem 1/TW/Dumitru_Claudia_Stefania/baza de date/schema_completa_cu_imagini.sql"

# 3. Verifică:
USE magazine_plusuri;
SHOW TABLES;
```

---

## 🚀 BACKEND SERVER (Node.js)

### Setup Inițial:

```bash
# 1. Navighează la folder backend
cd "d:\Facultate\An3\Sem 1\TW\Dumitru_Claudia_Stefania\backend"

# 2. Instalează dependențe
npm install

# 3. Configurează .env
# Editează backend\.env cu detalii MySQL
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=parola_ta
DB_NAME=magazine_plusuri
JWT_SECRET=super_secret_key_change_in_production

# 4. Pornește serverul
npm start
# Sau în development mode cu auto-reload:
npm run dev
```

Server va rula pe `http://localhost:3000`

### Endpoints API:

#### 🔐 **AUTENTIFICARE**

```javascript
POST /api/auth/register
{
  "username": "ion123",
  "email": "ion@example.com",
  "parola": "parola_secure",
  "nume_complet": "Ion Popescu"
}
// Response: { user, token }

POST /api/auth/login
{
  "usernameOrEmail": "ion123",
  "parola": "parola_secure"
}
// Response: { user, token }

GET /api/auth/me
// Headers: Authorization: Bearer TOKEN
// Response: { user }

PUT /api/auth/profil
{
  "nume_complet": "Ion P",
  "telefon": "0700123456",
  "adresa": "Str. X, Nr. 5",
  "oras": "București",
  "cod_postal": "010101",
  "tara": "România"
}

POST /api/auth/change-password
{
  "parola_veche": "old_pass",
  "parola_noua": "new_pass"
}
```

#### 📦 **PRODUSE**

```javascript
GET /api/produse
GET /api/produse?id_categorie=1&search=hamster&page=1&limit=20
// Response: Array of products

GET /api/produse/:id
// Response: { produs cu imagini și recenzii }

GET /api/produse/:id/imagini/:id_imagine
// Response: Imagine binară (BLOB)

POST /api/produse (ADMIN ONLY)
FormData: {
  "nume_produs": "Hamster mic",
  "descriere": "Descriere...",
  "pret_unitar": 40,
  "stoc": 5,
  "id_categorie": 1,
  "imagini": [file1, file2, ...] // upload multiple imagini
}

PUT /api/produse/:id (ADMIN ONLY)
// Similar cu POST, update produsul

DELETE /api/produse/:id (ADMIN ONLY)
// Soft delete (setează activ = 0)
```

#### 🛒 **COS DE CUMPARATURI**

```javascript
GET /api/cos
// Headers: Authorization: Bearer TOKEN
// Response: Array of cart items

POST /api/cos
{
  "id_produs": 1,
  "cantitate": 2,
  "culoare_selectata": "roșu"
}

PUT /api/cos/:id
{
  "cantitate": 3
}

DELETE /api/cos/:id
// Șterge item din cos

DELETE /api/cos
// Golește tot cosul
```

#### 📮 **COMENZI**

```javascript
POST /api/comenzi
{
  "nume_client": "Ion Popescu",
  "email_client": "ion@example.com",
  "telefon_client": "0700123456",
  "adresa_livrare": "Str. X, Nr. 5",
  "oras_livrare": "București",
  "cod_postal_livrare": "010101",
  "tara_livrare": "România",
  "metoda_plata": "plata_la_livrare",
  "note": "Mesaj opțional..."
}
// Response: { id_comanda }

GET /api/comenzi
// Comenzile utilizatorului curent

GET /api/comenzi/:id
// Detalii comenză cu liniile
```

#### ⭐ **RECENZII**

```javascript
POST /api/recenzii
{
  "id_produs": 1,
  "titlu": "Foarte frumos!",
  "comentariu": "Material de calitate...",
  "rating": 5
}
// Status: "in_asteptare" - așteptă admin approval

GET /api/produse/:id/recenzii
// Doar review-urile aprobate
```

#### ❤️ **FAVORITE**

```javascript
GET /api/favorite
// Produsele favorite ale userului

POST /api/favorite/:id_produs
// Adaugă la favorite

DELETE /api/favorite/:id_produs
// Șterge din favorite

GET /api/favorite/check/:id_produs
// { isFavorite: true/false }
```

#### 📂 **CATEGORII**

```javascript
GET /api/categorii
// Toate categoriile
```

---

## 💻 FRONTEND JAVASCRIPT

### Fișiere Noi:

1. **`auth-api.js`** - Modulul de autentificare (înlocuiește localStorage)
2. **`products-api.js`** - Modulul de produse și comenzi

### Utilizare în HTML:

```html
<!-- Adaugă scripturi-urile în order corect -->
<script src="auth-api.js"></script>
<script src="products-api.js"></script>
<script src="site-ui.js"></script>
```

### Exemplu Login (login.html):

```javascript
// Cand utilizatorul apasa Login:
auth.login(username, password)
  .then(function(user){
    console.log('Logat cu succes:', user);
    window.location.href = 'index.html';
  })
  .catch(function(err){
    alert('Eroare: ' + err.message);
  });

// Token este salvat automat in localStorage
// Toate requesturile API sunt authenticate automat
```

### Exemplu Produse (produse.html):

```javascript
// Load produse la incarcare pagina:
productsAPI.getProducts({ page: 1, limit: 20 })
  .then(function(produse){
    console.log('Produse:', produse);
    // Afiseaza produsele
    produse.forEach(function(produs){
      // produs.imagini = array cu id-uri imagini
      // Pentru afisare imagine:
      var img_url = productsAPI.getProductImage(produs.id_produs, produs.imagini[0].id_imagine);
      // <img src="...img_url...">
    });
  });

// Cand user apasa "Adauga in cos":
productsAPI.addToCart(id_produs, cantitate, culoare)
  .then(function(){ alert('Adaugat in cos'); })
  .catch(function(err){ alert('Eroare: ' + err.message); });

// Load cos:
productsAPI.getCart()
  .then(function(items){
    // items = array cu cos items
  });

// Creeaza comanda:
productsAPI.createOrder({
  nume_client: 'Ion',
  email_client: 'ion@example.com',
  // ... alte campuri
})
.then(function(data){
  console.log('Comanda creata:', data.id_comanda);
})
.catch(function(err){ alert('Eroare: ' + err.message); });
```

---

## 🎨 MODIFICARI NECESARE IN HTML

### 1. **login.html** - Autentificare din API

```html
<form id="login-form" onsubmit="handleLogin(event); return false;">
  <input type="text" id="username" placeholder="Utilizator sau Email" required>
  <input type="password" id="password" placeholder="Parolă" required>
  <button type="submit">Login</button>
</form>

<script>
function handleLogin(e){
  e.preventDefault();
  var username = document.getElementById('username').value;
  var password = document.getElementById('password').value;
  
  auth.login(username, password)
    .then(function(user){
      alert('Binevenit, ' + user.username + '!');
      window.location.href = 'index.html';
    })
    .catch(function(err){
      alert('Eroare: ' + err.message);
    });
}
</script>
```

### 2. **produse.html** - Afisare Produse din BD

```html
<div id="products-container"></div>

<script>
// La incarcare pagina
document.addEventListener('DOMContentLoaded', function(){
  loadProducts();
});

function loadProducts(){
  productsAPI.getProducts()
    .then(function(produse){
      var container = document.getElementById('products-container');
      container.innerHTML = '';
      
      produse.forEach(function(p){
        var card = document.createElement('div');
        card.className = 'product-card';
        
        // Get prima imagine
        var img_url = '';
        if(p.imagini && p.imagini.length > 0){
          img_url = productsAPI.getProductImage(p.id_produs, p.imagini[0].id_imagine);
        }
        
        card.innerHTML = '<img src="' + img_url + '" alt="' + p.nume_produs + '">' +
                        '<h3>' + p.nume_produs + '</h3>' +
                        '<p>' + p.pret_unitar + ' RON</p>' +
                        '<button onclick="addToCart(' + p.id_produs + ')">Adaugă în coș</button>';
        container.appendChild(card);
      });
    });
}

function addToCart(id_produs){
  productsAPI.addToCart(id_produs, 1)
    .then(function(){
      alert('Adaugat în coș!');
    })
    .catch(function(err){
      alert('Eroare: ' + err.message);
    });
}
</script>
```

### 3. **cart.html** - Cos din API

```html
<div id="cart-items"></div>

<script>
function loadCart(){
  productsAPI.getCart()
    .then(function(items){
      var container = document.getElementById('cart-items');
      container.innerHTML = '';
      
      if(items.length === 0){
        container.innerHTML = '<p>Cosul este gol</p>';
        return;
      }
      
      items.forEach(function(item){
        var row = document.createElement('div');
        row.className = 'cart-row';
        row.innerHTML = 
          '<p>' + item.nume_produs + '</p>' +
          '<input type="number" value="' + item.cantitate + '" ' +
          'onchange="updateCart(' + item.id_cos + ', this.value)">' +
          '<p>' + (item.pret_unitar * item.cantitate) + ' RON</p>' +
          '<button onclick="removeFromCart(' + item.id_cos + ')">Șterge</button>';
        container.appendChild(row);
      });
    });
}

function updateCart(id_cos, cantitate){
  productsAPI.updateCartItem(id_cos, parseInt(cantitate))
    .then(function(){ loadCart(); });
}

function removeFromCart(id_cos){
  productsAPI.deleteCartItem(id_cos)
    .then(function(){ loadCart(); });
}

document.addEventListener('DOMContentLoaded', loadCart);
</script>
```

---

## 🔒 SECURITATE

### Parole Criptate cu bcrypt
- Fiecare parolă e hashată cu 10 salt rounds
- Chiar dacă DB e breach, parolele nu pot fi recuperate
- Verif ication prin `bcrypt.compare()` - imposibil timing attack

### JWT Tokens
- Login generează JWT token cu expirare 7 zile
- Token stocat în localStorage
- Trimis în header Authorization: Bearer TOKEN
- Verificat pe server la fiecare request

### CORS
- Backend permite CORS de la frontend
- Doar api endpoints sunt expuse

---

## 🚨 TROUBLESHOOTING

### Eroare: "Cannot connect to MySQL"
```bash
# Verifică dacă MySQL e pornit
# Windows:
net start MySQL80

# Linux/Mac:
mysql.server start
```

### Eroare: "CORS error"
```javascript
// Asigură-te că backend e pornit:
// http://localhost:3000
// În .env verifică PORT=3000
```

### Eroare: "No files selected" la upload imagini
```javascript
// Asigură-te că form are enctype="multipart/form-data"
// și inputul file e cu type="file" multiple
```

### Imagini nu se afisează
```javascript
// Verifică că ID-ul imaginii e corect
var url = productsAPI.getProductImage(id_produs, id_imagine);
console.log('Image URL:', url);
// URL ar trebui: http://localhost:3000/api/produse/1/imagini/5
```

---

## 📈 FLUXUL COMPLET

### 1. **User Registration & Login**
```
User → register/login form → API /auth/register/login → JWT token
       ↓
Token salvat în localStorage
```

### 2. **Browsing Produse**
```
Page load → API /api/produse → Array of products
      ↓
Get imagini: API /api/produse/ID/imagini/ID_IMAGINE
      ↓
Display produse cu imagini din BD
```

### 3. **Shopping Cart**
```
Add to cart → API POST /api/cos → Item salvat în cos
      ↓
View cart → API GET /api/cos → Display items
      ↓
Update quantity → API PUT /api/cos/ID → Update BD
      ↓
Checkout → API POST /api/comenzi → Crează comanda
```

### 4. **Comenzi & Orders**
```
Order Created → API /api/comenzi → INSERT in BD
      ↓
Detalii comanda → INSERT in detalii_comanda
      ↓
Stock update → Scade stoc din tabela produse
      ↓
User views orders → API GET /api/comenzi → Afisare istoric
```

---

## 🎓 RESURSURI UTILE

- **bcrypt docs**: https://github.com/kelektiv/node.bcrypt.js
- **JWT**: https://jwt.io
- **Express.js**: https://expressjs.com
- **MySQL2**: https://github.com/sidorares/node-mysql2

---

## ✅ CHECKLIST FINAL

- [ ] MySQL installat și rulează
- [ ] Bază de date creată cu schema SQL
- [ ] Folder backend cu package.json
- [ ] npm install în backend folder
- [ ] .env configurate cu DB credentials
- [ ] Backend server rulează pe port 3000
- [ ] Frontend scripturi incluse: auth-api.js, products-api.js
- [ ] Login/Register testată
- [ ] Produse se afisează din BD
- [ ] Cos de cumpărături funcționează
- [ ] Comenzi se creează și salveaza în BD

---

## 📞 SUPORT

Dacă ai probleme:
1. Verifică console browser (F12 → Console tab)
2. Verifică terminal backend pentru errori
3. Verifică că MySQL e pornit
4. Verifică .env cu credentiale corecte
5. Verifică logs MySQL pentru SQL errors

**Gata! 🎉 Sistem complet cu bază de date, imagini BLOB și parole criptate!**
