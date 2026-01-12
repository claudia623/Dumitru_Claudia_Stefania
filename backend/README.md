# Backend Server - Magazin Plușuri Croșetate

Express.js API server pentru magazinul online cu suport complet pentru:
- Authentication cu JWT + bcrypt
- Produse cu imagini BLOB
- Coș de cumpărături
- Comenzi tracking
- Recenzii cu moderation
- Favorite
- Admin panel

## 🚀 Quick Start

### Prerequisites
- Node.js v12+ ([download](https://nodejs.org))
- MySQL 5.7+ ([download](https://www.mysql.com/downloads/mysql/))

### Setup

```bash
# 1. Install dependencies
npm install

# 2. Configure .env file
# Edit .env with your MySQL credentials:
# DB_HOST=localhost
# DB_USER=root
# DB_PASSWORD=
# DB_NAME=magazine_plusuri

# 3. Create database
# Run schema_completa_cu_imagini.sql in MySQL

# 4. Start server
npm start
# Server will run on http://localhost:3000
```

## 🔨 Development

```bash
# Install nodemon for auto-reload
npm install --save-dev nodemon

# Run in development mode
npm run dev
```

## 📚 API Documentation

### Authentication

#### Register
```
POST /api/auth/register
Content-Type: application/json

{
  "username": "john_doe",
  "email": "john@example.com",
  "parola": "secure_password",
  "nume_complet": "John Doe"
}

Response:
{
  "message": "Înregistrare reușită",
  "user": { id_utilizator, username, email, rol },
  "token": "eyJhbGc..."
}
```

#### Login
```
POST /api/auth/login
Content-Type: application/json

{
  "usernameOrEmail": "john_doe",
  "parola": "secure_password"
}

Response:
{
  "message": "Autentificare reușită",
  "user": { id_utilizator, username, email, rol },
  "token": "eyJhbGc..."
}
```

#### Get Current User
```
GET /api/auth/me
Authorization: Bearer TOKEN

Response:
{
  "user": { id_utilizator, username, email, ... }
}
```

### Products

#### Get All Products
```
GET /api/produse?id_categorie=1&search=hamster&page=1&limit=20

Response: Array of products with imagini array
```

#### Get Product
```
GET /api/produse/1

Response:
{
  "id_produs": 1,
  "nume_produs": "Hamster",
  "pret_unitar": 40,
  "imagini": [{ id_imagine, mime_type, ordinea }],
  "recenzii": [{ id_recenzie, rating, comentariu, ... }]
}
```

#### Get Product Image (BLOB)
```
GET /api/produse/1/imagini/5

Response: Binary image data
Content-Type: image/jpeg (or other mime type)
```

#### Add Product (Admin)
```
POST /api/produse
Authorization: Bearer ADMIN_TOKEN
Content-Type: multipart/form-data

Form Data:
- nume_produs: string
- descriere: string
- pret_unitar: number
- pret_reducere: number (optional)
- stoc: number
- id_categorie: number
- culori_disponibile: string
- timp_livrare_zile: number
- material: string
- marime: string
- greutate: number
- imagini: File[] (up to 10 images)

Response:
{
  "message": "Produs adăugat",
  "id_produs": 123
}
```

### Cart

#### Get Cart
```
GET /api/cos
Authorization: Bearer TOKEN

Response: Array of cart items with images
```

#### Add to Cart
```
POST /api/cos
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "id_produs": 1,
  "cantitate": 2,
  "culoare_selectata": "roșu"
}

Response: { message: "Produs adăugat în cos" }
```

#### Update Cart Item
```
PUT /api/cos/1
Authorization: Bearer TOKEN
Content-Type: application/json

{ "cantitate": 3 }

Response: { message: "Cos actualizat" }
```

#### Remove from Cart
```
DELETE /api/cos/1
Authorization: Bearer TOKEN

Response: { message: "Produs șters din cos" }
```

### Orders

#### Create Order
```
POST /api/comenzi
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "nume_client": "John Doe",
  "email_client": "john@example.com",
  "telefon_client": "0700123456",
  "adresa_livrare": "Str. X, Nr. 5",
  "oras_livrare": "București",
  "cod_postal_livrare": "010101",
  "tara_livrare": "România",
  "metoda_plata": "plata_la_livrare",
  "note": "Optional message"
}

Response:
{
  "message": "Comanda creată",
  "id_comanda": 123
}
```

#### Get Orders
```
GET /api/comenzi
Authorization: Bearer TOKEN

Response: Array of user's orders
```

#### Get Order Details
```
GET /api/comenzi/123
Authorization: Bearer TOKEN

Response:
{
  "comanda": { id_comanda, status, total, ... },
  "detalii": [ { id_produs, cantitate, pret_unitar, ... } ]
}
```

### Reviews

#### Add Review
```
POST /api/recenzii
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "id_produs": 1,
  "titlu": "Foarte frumos!",
  "comentariu": "Material de calitate...",
  "rating": 5
}

Response: { message: "Recenzie adăugată, în așteptare de aprobare" }
```

#### Get Product Reviews
```
GET /api/produse/1/recenzii

Response: Array of approved reviews
```

### Favorites

#### Get Favorites
```
GET /api/favorite
Authorization: Bearer TOKEN

Response: Array of favorite products
```

#### Add Favorite
```
POST /api/favorite/1
Authorization: Bearer TOKEN

Response: { message: "Adăugat la favorite" }
```

#### Remove Favorite
```
DELETE /api/favorite/1
Authorization: Bearer TOKEN

Response: { message: "Șters din favorite" }
```

### Categories

#### Get Categories
```
GET /api/categorii

Response: Array of categories
```

## 🔐 Security

- **Password Encryption**: bcrypt with 10 salt rounds
- **Authentication**: JWT tokens with 7-day expiration
- **Input Validation**: Server-side validation on all endpoints
- **SQL Injection Prevention**: Prepared statements via mysql2
- **CORS**: Enabled for frontend origin
- **File Upload**: Validated MIME types and file size limits

## 🗄️ Database

The database schema includes:
- `utilizatori` - User accounts with bcrypt password hashes
- `produse` - Product information
- `imagini_produse` - Product images stored as BLOB
- `cos_cumparaturi` - Shopping cart items
- `comenzi` - Orders with complete tracking
- `detalii_comanda` - Order line items
- `recenzii` - Product reviews with moderation
- `favorite` - User favorites
- `categorii` - Product categories
- `tracing_comenzi` - Order status history
- `notificari_email` - Email notifications queue

## 🚨 Environment Variables (.env)

```
# Server
PORT=3000

# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=magazine_plusuri

# Security
JWT_SECRET=your-secret-key-here-change-in-production

# Environment
NODE_ENV=development
```

⚠️ **WARNING**: Never commit .env file with real credentials to version control!

## 📦 Dependencies

- `express` - Web framework
- `mysql2` - MySQL driver with promises
- `bcrypt` - Password hashing
- `jsonwebtoken` - JWT authentication
- `multer` - File upload handling
- `cors` - CORS middleware
- `dotenv` - Environment variables

## 🛠️ Troubleshooting

### Cannot connect to MySQL
```bash
# Check if MySQL is running
# Windows: net start MySQL80
# macOS: mysql.server start
# Linux: sudo service mysql start
```

### Port 3000 already in use
```bash
# Change PORT in .env to another port (3001, 3002, etc.)
# Or kill process using port 3000
```

### Image upload fails
```bash
# Check that multer is configured correctly
# Verify MIME types are allowed
# Check file size is under 10MB
```

### Unauthorized errors
```bash
# Verify JWT token in Authorization header
# Check token format: "Bearer TOKEN"
# Verify JWT_SECRET matches
```

## 📈 Performance

- Connection pooling for database efficiency
- Indexed database queries
- Optimized image handling via BLOB
- Prepared statements prevent SQL injection

## 🔄 Deployment

For production deployment:
1. Use strong JWT_SECRET
2. Enable HTTPS
3. Set NODE_ENV=production
4. Configure database backups
5. Setup monitoring and logging
6. Use environment-specific .env files
7. Consider rate limiting and caching

## 📞 Support

Check server.js comments for detailed endpoint documentation.

For client-side integration, see: `/Dumitru_Claudia_Stefania/auth-api.js` and `products-api.js`

---

**Version**: 1.0.0  
**Created**: January 11, 2025  
**Status**: ✅ Production Ready
