-- إنشاء قاعدة البيانات
CREATE DATABASE IF NOT EXISTS cafe_drive CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE cafe_drive;

-- جدول العملاء
CREATE TABLE IF NOT EXISTS customers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    phone VARCHAR(20) UNIQUE NOT NULL,
    pin VARCHAR(4) NOT NULL,
    name VARCHAR(100),
    email VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- جدول التصنيفات
CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    icon VARCHAR(50) DEFAULT '☕',
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- جدول المنتجات
CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category_id INT,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    image VARCHAR(500),
    is_available BOOLEAN DEFAULT TRUE,
    is_popular BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- جدول الطلبات
CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_number VARCHAR(20) UNIQUE NOT NULL,
    customer_name VARCHAR(100) NOT NULL,
    customer_phone VARCHAR(20),
    car_type VARCHAR(100),
    car_color VARCHAR(50),
    car_plate VARCHAR(20),
    order_type ENUM('drive_thru', 'pickup') NOT NULL DEFAULT 'pickup',
    status ENUM('pending', 'preparing', 'ready', 'delivered', 'cancelled') DEFAULT 'pending',
    total_amount DECIMAL(10, 2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- جدول تفاصيل الطلب
CREATE TABLE IF NOT EXISTS order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT,
    product_name VARCHAR(200) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    unit_price DECIMAL(10, 2) NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL,
    notes TEXT,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
);

-- إضافة بيانات تجريبية
INSERT INTO categories (name, icon, sort_order) VALUES
('قهوة ساخنة', '☕', 1),
('قهوة باردة', '🧊', 2),
('مشروبات منعشة', '🍹', 3),
('حلويات', '🍰', 4),
('وجبات خفيفة', '🥪', 5);

INSERT INTO products (category_id, name, description, price, is_popular) VALUES
(1, 'اسبريسو', 'قهوة اسبريسو إيطالية أصلية', 12.00, TRUE),
(1, 'كابتشينو', 'اسبريسو مع حليب مخفوق ورغوة كريمية', 18.00, TRUE),
(1, 'لاتيه', 'اسبريسو مع حليب ساخن', 16.00, TRUE),
(1, 'موكا', 'اسبريسو مع شوكولاتة وحليب', 20.00, FALSE),
(1, 'قهوة عربية', 'قهوة عربية أصيلة مع الهيل', 8.00, TRUE),
(2, 'آيس لاتيه', 'لاتيه مثلج منعش', 18.00, TRUE),
(2, 'آيس موكا', 'موكا مثلجة مع كريمة', 22.00, FALSE),
(2, 'كولد برو', 'قهوة باردة مختمرة ببطء', 20.00, TRUE),
(2, 'فرابتشينو كراميل', 'مشروب مثلج بالكراميل', 25.00, TRUE),
(3, 'عصير برتقال طازج', 'عصير برتقال طبيعي 100%', 15.00, FALSE),
(3, 'سموذي مانجو', 'سموذي المانجو الاستوائي', 18.00, TRUE),
(3, 'ليموناضة', 'ليمون طازج مع نعناع', 12.00, FALSE),
(4, 'تشيز كيك', 'تشيز كيك بالتوت', 25.00, TRUE),
(4, 'براوني', 'براوني شوكولاتة ساخن', 18.00, FALSE),
(4, 'كوكيز', 'كوكيز محشوة بالشوكولاتة', 10.00, FALSE),
(5, 'كرواسون', 'كرواسون طازج بالزبدة', 12.00, TRUE),
(5, 'ساندويش جبنة', 'ساندويش جبنة مشوية', 20.00, FALSE);

