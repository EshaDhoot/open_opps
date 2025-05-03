package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"

	"job-aggregator/config"
	"job-aggregator/internal/admin"
	"job-aggregator/internal/auth"
	"job-aggregator/internal/job"
	"job-aggregator/internal/notification"
	"job-aggregator/internal/organization"
	"job-aggregator/internal/scraper"
	"job-aggregator/internal/user"
	"job-aggregator/pkg/database"

	"github.com/gorilla/mux"
)

func main() {
	// Load configuration
	cfg := config.LoadConfig()
	port := cfg.Server.Port

	// Initialize database connection
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
	fmt.Println("Database schema initialized successfully")

	// Initialize router
	router := mux.NewRouter()

	// Add a health check endpoint
	router.HandleFunc("/api/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"status":"ok","message":"Server is running with database connection"}`))
	}).Methods("GET")

	// Register routes for each service
	auth.RegisterRoutes(router, db)
	job.RegisterRoutes(router, db)
	user.RegisterRoutes(router, db)
	organization.RegisterRoutes(router, db)
	admin.RegisterRoutes(router, db)
	notification.RegisterRoutes(router, db)

	// Start the web scraper in a separate goroutine
	go scraper.StartScheduler(db)

	// Start the server
	srv := &http.Server{
		Addr:    ":" + port,
		Handler: router,
	}

	// Run the server in a goroutine
	go func() {
		fmt.Printf("Server starting on port %s...\n", port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Failed to start server: %v", err)
		}
	}()

	// Set up graceful shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	fmt.Println("Server shutting down...")
}
