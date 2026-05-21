CREATE DATABASE IF NOT EXISTS craft_local;
USE craft_local;

-- 1. ตารางผู้ใช้งาน (Users) รองรับระบบแบ่ง Role
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('Admin', 'Customer') DEFAULT 'Customer'
);

-- 2. ตารางสินค้า (Products)
CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    stock INT NOT NULL,
    image_url VARCHAR(255)
);

-- 3. ตารางรีวิวสินค้า (Reviews)
CREATE TABLE IF NOT EXISTS reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT,
    reviewer_name VARCHAR(100) NOT NULL,
    rating INT CHECK (rating BETWEEN 1 AND 5),
    comment TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- บันทึกข้อมูลผู้ใช้งานเริ่มต้น (รหัสผ่านคือ password123 เข้ารหัสไว้)
INSERT INTO users (username, password, role) VALUES
('admin', '$2a$10$R9hZqR/rOMLbJ2gN.lBEqum8qjDRE4F5B3vjXQhJ9C.XqGZpW6m26', 'Admin'),
('customer1', '$2a$10$R9hZqR/rOMLbJ2gN.lBEqum8qjDRE4F5B3vjXQhJ9C.XqGZpW6m26', 'Customer');

-- Seeder ข้อมูลสินค้าตัวอย่าง 10 รายการ
INSERT INTO products (name, category, price, stock, image_url) VALUES
('กระเป๋าสานผักตบชวา', 'Bag', 450.00, 15, 'https://picsum.photos/300/200?random=1'),
('ผ้าทอมือย้อมสีธรรมชาติ', 'Textile', 1200.00, 5, 'https://picsum.photos/300/200?random=2'),
('เครื่องปั้นดินเผาเบญจรงค์', 'Pottery', 850.00, 8, 'https://picsum.photos/300/200?random=3'),
('ร่มบ่อสร้างเชียงใหม่', 'Accessory', 350.00, 20, 'https://picsum.photos/300/200?random=4'),
('เสื่อกกทอมือลายโบราณ', 'Home', 600.00, 12, 'https://picsum.photos/300/200?random=5'),
('หมวกสานใบลาน', 'Bag', 290.00, 25, 'https://picsum.photos/300/200?random=6'),
('ผ้าไหมแพรวา', 'Textile', 3500.00, 3, 'https://picsum.photos/300/200?random=7'),
('ถ้วยชามศิลาดล', 'Pottery', 400.00, 10, 'https://picsum.photos/300/200?random=8'),
('โคมไฟไม้ไผ่สาน', 'Home', 750.00, 7, 'https://picsum.photos/300/200?random=9'),
('พวงกุญแจผ้าปักม้ง', 'Accessory', 99.00, 50, 'https://picsum.photos/300/200?random=10');
