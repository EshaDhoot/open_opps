package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"

	"job-aggregator/config"

	"github.com/gorilla/mux"
)

func mainNoDb() {
	// Load configuration
	cfg := config.LoadConfig()
	port := cfg.Server.Port

	// Initialize router
	router := mux.NewRouter()

	// Add a simple health check route
	router.HandleFunc("/api/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"status":"ok","message":"Server is running without database connection"}`))
	}).Methods("GET")

	// Start the server
	srv := &http.Server{
		Addr:    ":" + port,
		Handler: router,
	}

	// Run the server in a goroutine
	go func() {
		fmt.Printf("Server starting on port %s (without database)...\n", port)
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
