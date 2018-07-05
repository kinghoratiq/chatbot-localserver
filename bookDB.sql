DROP DATABASE IF EXISTS library;
CREATE DATABASE library;
USE library;

CREATE TABLE user(
	user_id VARCHAR(255) NOT NULL UNIQUE PRIMARY KEY,
	username VARCHAR(255) DEFAULT NULL
);

CREATE TABLE book(
	book_id INT NOT NULL AUTO_INCREMENT UNIQUE PRIMARY KEY,
	title TEXT NOT NULL,
	author TEXT NOT NULL,
	category TEXT NOT NULL,
	image TEXT NOT NULL,
	isBorrowed BOOLEAN DEFAULT 0,
	user_id VARCHAR(255) DEFAULT NULL,
	FOREIGN KEY (user_id) REFERENCES user(user_id)
);