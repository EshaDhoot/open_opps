package main

import (
	"fmt"
	"log"

	"job-aggregator/pkg/database"
)

func main() {
	// Connect to database
	db, err := database.Connect()
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer db.Close()

	// Initialize database schema
	err = database.InitSchema(db)
	if err != nil {
		log.Fatalf("Failed to initialize database schema: %v", err)
	}

	fmt.Println("Database connection and schema initialization successful!")
}
