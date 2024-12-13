CREATE DATABASE miniproject;
USE miniproject;
CREATE USER 'app2023'@'localhost' IDENTIFIED WITH mysql_native_password BY 'app2023';
GRANT ALL PRIVILEGES ON miniproject.* TO 'app2023'@'localhost';
ALTER USER 'app2023'@'localhost' IDENTIFIED WITH mysql_native_password BY 'app2023';
CREATE TABLE users (
    id INT AUTO_INCREMENT,
    first_name VARCHAR(50) NOT NULL, 
    last_name VARCHAR(50) NOT NULL, 
    username VARCHAR(50) NOT NULL unique, 
    email VARCHAR(50) NOT NULL unique,
    country VARCHAR(50) NOT NULL, 
    password VARCHAR(500), 
    PRIMARY KEY(id)
    );

ALTER TABLE users
MODIFY COLUMN country VARCHAR(255) DEFAULT 'United Kingdome';

CREATE TABLE Session (
    session_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    logout_time TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE SearchHistory (
    search_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    search_query VARCHAR(255) NOT NULL,
    search_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES  users(id)
);

CREATE TABLE books (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  author VARCHAR(255) NOT NULL,
  genre VARCHAR(100) NOT NULL,
  year INT NOT NULL
);

ALTER TABLE books
ADD COLUMN price DECIMAL(10, 2) NOT NULL;




