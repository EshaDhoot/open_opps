package database

import (
	"database/sql"
	"fmt"

	"job-aggregator/config"

	_ "github.com/lib/pq"
)

// Connect establishes a connection to the PostgreSQL database
func Connect() (*sql.DB, error) {
	// Get database configuration
	cfg := config.LoadConfig()
	dbConfig := cfg.Database

	// Construct connection string
	connStr := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
		dbConfig.Host, dbConfig.Port, dbConfig.User, dbConfig.Password, dbConfig.DBName)

	// Open connection to database
	db, err := sql.Open("postgres", connStr)
	if err != nil {
		return nil, err
	}

	// Test the connection
	err = db.Ping()
	if err != nil {
		return nil, err
	}

	fmt.Println("Successfully connected to database")
	return db, nil
}

// InitSchema initializes the database schema
func InitSchema(db *sql.DB) error {
	// Create users table
	_, err := db.Exec(`
		CREATE TABLE IF NOT EXISTS users (
			id SERIAL PRIMARY KEY,
			email VARCHAR(255) UNIQUE NOT NULL,
			password_hash VARCHAR(255) NOT NULL,
			name VARCHAR(255) NOT NULL,
			role VARCHAR(50) NOT NULL,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		)
	`)
	if err != nil {
		return err
	}

	// Create organizations table
	_, err = db.Exec(`
		CREATE TABLE IF NOT EXISTS organizations (
			id SERIAL PRIMARY KEY,
			name VARCHAR(255) NOT NULL,
			description TEXT,
			website VARCHAR(255),
			logo_url VARCHAR(255),
			user_id INT REFERENCES users(id),
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		)
	`)
	if err != nil {
		return err
	}

	// Create jobs table
	_, err = db.Exec(`
		CREATE TABLE IF NOT EXISTS jobs (
			id SERIAL PRIMARY KEY,
			title VARCHAR(255) NOT NULL,
			description TEXT NOT NULL,
			company VARCHAR(255) NOT NULL,
			location VARCHAR(255),
			salary_range VARCHAR(255),
			job_type VARCHAR(100),
			url VARCHAR(255),
			source VARCHAR(100),
			is_external BOOLEAN DEFAULT FALSE,
			is_approved BOOLEAN DEFAULT FALSE,
			organization_id INT REFERENCES organizations(id),
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		)
	`)
	if err != nil {
		return err
	}

	// Create bookmarks table
	_, err = db.Exec(`
		CREATE TABLE IF NOT EXISTS bookmarks (
			id SERIAL PRIMARY KEY,
			user_id INT REFERENCES users(id),
			job_id INT REFERENCES jobs(id),
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			UNIQUE(user_id, job_id)
		)
	`)
	if err != nil {
		return err
	}

	// Create reminders table
	_, err = db.Exec(`
		CREATE TABLE IF NOT EXISTS reminders (
			id SERIAL PRIMARY KEY,
			user_id INT REFERENCES users(id),
			job_id INT REFERENCES jobs(id),
			remind_at TIMESTAMP NOT NULL,
			is_sent BOOLEAN DEFAULT FALSE,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		)
	`)
	if err != nil {
		return err
	}

	// Create scraped_sources table
	_, err = db.Exec(`
		CREATE TABLE IF NOT EXISTS scraped_sources (
			id SERIAL PRIMARY KEY,
			name VARCHAR(100) NOT NULL,
			url VARCHAR(255) NOT NULL,
			last_scraped_at TIMESTAMP,
			is_active BOOLEAN DEFAULT TRUE,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		)
	`)
	if err != nil {
		return err
	}

	return nil
}
