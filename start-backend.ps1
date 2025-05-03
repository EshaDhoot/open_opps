# Set environment variables for database connection
$env:DB_HOST = "localhost"
$env:DB_PORT = "5432"
$env:DB_USER = "postgres"
$env:DB_PASSWORD = "postgres"
$env:DB_NAME = "job_aggregator"
$env:PORT = "8081"

# Navigate to backend directory and run the server
cd backend
go run cmd/main.go
