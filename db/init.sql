-- Tạo database
CREATE DATABASE IF NOT EXISTS coffee_shop CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE coffee_shop;

-- Bảng users
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Bảng products
CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  category VARCHAR(60) NOT NULL,
  description TEXT NOT NULL,
  price INT NOT NULL,
  image_url VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Dữ liệu mẫu
INSERT INTO products (name, category, description, price, image_url) VALUES
  ('Cà phê Espresso', 'Espresso', 'Ly espresso đậm đặc, hương thơm nồng nàn của cà phê rang xay.', 49000, '/images/products/espresso.jpg'),
  ('Cà phê Latte', 'Latte', 'Latte kem sữa mịn màng, hòa quyện cùng cà phê rang xay.', 62000, '/images/products/latte.jpg'),
  ('Cold Brew', 'Cold Brew', 'Cold brew pha lạnh 12 giờ, vị êm dịu và rất dễ uống.', 68000, '/images/products/cold-brew.jpg'),
  ('Cappuccino', 'Cappuccino', 'Cappuccino với lớp bọt sữa mịn mềm cùng bột cacao.', 63000, '/images/products/cappuccino.jpg'),
  ('Cà phê sữa đá', 'Sữa đá', 'Cà phê sữa đá truyền thống, thơm vị sữa đặc và cà phê rang đậm.', 45000, 'https://images.unsplash.com/photo-1527169402691-a0b06755c784?auto=format&fit=crop&w=800&q=80');
