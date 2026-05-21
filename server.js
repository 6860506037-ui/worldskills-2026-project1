const express = require('express');
const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const path = require('path');

const app = express();
const JWT_SECRET = 'SuperSecretKey2026';

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// การเชื่อมต่อฐานข้อมูล (ป้องกัน SQL Injection ด้วย Prepared Statements)
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '', 
    database: 'craft_local'
};

let pool;
async function initDB() {
    pool = await mysql.createPool(dbConfig);
}
initDB();

// Middleware ตรวจสอบสิทธิ์ JWT (Authentication)
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) return res.status(401).json({ message: 'Access Token Required' });
    
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ message: 'Invalid or Expired Token' });
        req.user = user;
        next();
    });
}

// --- API ENDPOINTS ---

// 1. POST /api/login - ยืนยันตัวตนและออก JWT Token
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const [users] = await pool.execute('SELECT * FROM users WHERE username = ?', [username]);
        if (users.length === 0) return res.status(400).json({ message: 'User not found' });

        const user = users[0];
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) return res.status(400).json({ message: 'Invalid password' });

        const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
        res.json({ token, role: user.role, username: user.username });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. GET /api/products - ดึงข้อมูลสินค้าทั้งหมด (พร้อมระบบ Filter ตามหมวดหมู่)
app.get('/api/products', async (req, res) => {
    const { category } = req.query;
    try {
        let query = 'SELECT * FROM products';
        let params = [];
        
        if (category && category !== 'All') {
            query += ' WHERE category = ?';
            params.push(category);
        }
        
        const [rows] = await pool.execute(query, params);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. GET /api/products/:id/reviews - ดึงรีวิวของสินค้า
app.get('/api/products/:id/reviews', async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT * FROM reviews WHERE product_id = ? ORDER BY created_at DESC', [req.params.id]);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 4. POST /api/products/:id/reviews - เพิ่มรีวิวสินค้า (พร้อม Validation เข้มงวด)
app.post('/api/products/:id/reviews', async (req, res) => {
    const { reviewer_name, rating, comment } = req.body;
    const productId = req.params.id;

    // Validation ป้องกันข้อมูลผิดพลาด
    if (!reviewer_name || !rating || !comment || rating < 1 || rating > 5 || comment.trim().length < 10) {
        return res.status(422).json({ message: 'Validation Failed: Rating 1-5, Comment min 10 chars.' });
    }

    try {
        // ป้องกัน XSS เบื้องต้นด้วยการแปลงอักขระพิเศษสำหรับข้อความคอมเมนต์
        const cleanComment = comment.replace(/</g, "&lt;").replace(/>/g, "&gt;");

        await pool.execute(
            'INSERT INTO reviews (product_id, reviewer_name, rating, comment) VALUES (?, ?, ?, ?)',
            [productId, reviewer_name, rating, cleanComment]
        );
        res.status(201).json({ message: 'Review added successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 5. PATCH /api/products/:id/reduce-stock - ตัดสต็อก (ห้ามติดลบ)
app.patch('/api/products/:id/reduce-stock', async (req, res) => {
    const productId = req.params.id;
    const { quantity } = req.body;
    
    try {
        // ดึงจำนวนสต็อกปัจจุบันมาตรวจสอบก่อน
        const [rows] = await pool.execute('SELECT stock FROM products WHERE id = ?', [productId]);
        if (rows.length === 0) return res.status(404).json({ message: 'Product not found' });
        
        const currentStock = rows[0].stock;
        if (currentStock - quantity < 0) {
            return res.status(400).json({ message: 'Operation failed: Stock cannot drop below 0' });
        }
        
        // อัปเดตสต็อกสินค้า
        await pool.execute('UPDATE products SET stock = stock - ? WHERE id = ?', [quantity, productId]);
        res.json({ message: 'Stock updated successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// เปิดการทำงานของเซิร์ฟเวอร์ที่ Port 3000
app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});
