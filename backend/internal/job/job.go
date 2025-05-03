package job

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/gorilla/mux"
)

// Job represents a job listing
type Job struct {
	ID            int    `json:"id"`
	Title         string `json:"title"`
	Description   string `json:"description"`
	Company       string `json:"company"`
	Location      string `json:"location"`
	SalaryRange   string `json:"salary_range"`
	JobType       string `json:"job_type"`
	URL           string `json:"url"`
	Source        string `json:"source"`
	IsExternal    bool   `json:"is_external"`
	IsApproved    bool   `json:"is_approved"`
	OrganizationID *int   `json:"organization_id"`
	CreatedAt     string `json:"created_at"`
	UpdatedAt     string `json:"updated_at"`
}

// JobRequest represents a job creation/update request
type JobRequest struct {
	Title         string `json:"title"`
	Description   string `json:"description"`
	Company       string `json:"company"`
	Location      string `json:"location"`
	SalaryRange   string `json:"salary_range"`
	JobType       string `json:"job_type"`
	URL           string `json:"url"`
	OrganizationID *int   `json:"organization_id"`
}

// RegisterRoutes registers the job routes
func RegisterRoutes(router *mux.Router, db *sql.DB) {
	// Public routes
	router.HandleFunc("/api/jobs", getJobsHandler(db)).Methods("GET")
	router.HandleFunc("/api/jobs/{id}", getJobHandler(db)).Methods("GET")
	
	// Protected routes (require authentication)
	jobRouter := router.PathPrefix("/api/jobs").Subrouter()
	// Add auth middleware here
	jobRouter.HandleFunc("", createJobHandler(db)).Methods("POST")
	jobRouter.HandleFunc("/{id}", updateJobHandler(db)).Methods("PUT")
	jobRouter.HandleFunc("/{id}", deleteJobHandler(db)).Methods("DELETE")
}

// getJobsHandler handles getting all jobs
func getJobsHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Parse query parameters
		query := r.URL.Query()
		title := query.Get("title")
		company := query.Get("company")
		location := query.Get("location")
		jobType := query.Get("job_type")
		
		// Build SQL query
		sqlQuery := "SELECT id, title, description, company, location, salary_range, job_type, url, source, is_external, is_approved, organization_id, created_at, updated_at FROM jobs WHERE is_approved = true"
		args := []interface{}{}
		argCount := 1
		
		if title != "" {
			sqlQuery += " AND title ILIKE $" + strconv.Itoa(argCount)
			args = append(args, "%"+title+"%")
			argCount++
		}
		
		if company != "" {
			sqlQuery += " AND company ILIKE $" + strconv.Itoa(argCount)
			args = append(args, "%"+company+"%")
			argCount++
		}
		
		if location != "" {
			sqlQuery += " AND location ILIKE $" + strconv.Itoa(argCount)
			args = append(args, "%"+location+"%")
			argCount++
		}
		
		if jobType != "" {
			sqlQuery += " AND job_type = $" + strconv.Itoa(argCount)
			args = append(args, jobType)
			argCount++
		}
		
		sqlQuery += " ORDER BY created_at DESC LIMIT 100"
		
		// Execute query
		rows, err := db.Query(sqlQuery, args...)
		if err != nil {
			http.Error(w, "Database error", http.StatusInternalServerError)
			return
		}
		defer rows.Close()
		
		// Parse results
		jobs := []Job{}
		for rows.Next() {
			var job Job
			err := rows.Scan(
				&job.ID, &job.Title, &job.Description, &job.Company, &job.Location,
				&job.SalaryRange, &job.JobType, &job.URL, &job.Source, &job.IsExternal,
				&job.IsApproved, &job.OrganizationID, &job.CreatedAt, &job.UpdatedAt,
			)
			if err != nil {
				http.Error(w, "Error parsing job data", http.StatusInternalServerError)
				return
			}
			jobs = append(jobs, job)
		}
		
		// Return jobs
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(jobs)
	}
}

// getJobHandler handles getting a single job
func getJobHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Get job ID from URL
		vars := mux.Vars(r)
		id, err := strconv.Atoi(vars["id"])
		if err != nil {
			http.Error(w, "Invalid job ID", http.StatusBadRequest)
			return
		}
		
		// Get job from database
		var job Job
		err = db.QueryRow(
			"SELECT id, title, description, company, location, salary_range, job_type, url, source, is_external, is_approved, organization_id, created_at, updated_at FROM jobs WHERE id = $1 AND is_approved = true",
			id,
		).Scan(
			&job.ID, &job.Title, &job.Description, &job.Company, &job.Location,
			&job.SalaryRange, &job.JobType, &job.URL, &job.Source, &job.IsExternal,
			&job.IsApproved, &job.OrganizationID, &job.CreatedAt, &job.UpdatedAt,
		)
		if err != nil {
			if err == sql.ErrNoRows {
				http.Error(w, "Job not found", http.StatusNotFound)
			} else {
				http.Error(w, "Database error", http.StatusInternalServerError)
			}
			return
		}
		
		// Return job
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(job)
	}
}

// createJobHandler handles creating a new job
func createJobHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Get user ID from context
		userID := r.Context().Value("user_id").(int)
		role := r.Context().Value("role").(string)
		
		// Parse request body
		var req JobRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			return
		}
		
		// Validate request
		if req.Title == "" || req.Description == "" || req.Company == "" {
			http.Error(w, "Missing required fields", http.StatusBadRequest)
			return
		}
		
		// Check if user is an organization or admin
		if role != "organization" && role != "admin" {
			http.Error(w, "Unauthorized", http.StatusForbidden)
			return
		}
		
		// If user is an organization, get their organization ID
		var organizationID *int
		if role == "organization" {
			err := db.QueryRow("SELECT id FROM organizations WHERE user_id = $1", userID).Scan(&organizationID)
			if err != nil {
				if err == sql.ErrNoRows {
					http.Error(w, "Organization not found", http.StatusBadRequest)
				} else {
					http.Error(w, "Database error", http.StatusInternalServerError)
				}
				return
			}
		} else {
			// Admin can specify organization ID
			organizationID = req.OrganizationID
		}
		
		// Insert job into database
		var job Job
		err := db.QueryRow(
			`INSERT INTO jobs (
				title, description, company, location, salary_range, job_type, url,
				source, is_external, is_approved, organization_id
			) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
			RETURNING id, title, description, company, location, salary_range, job_type, url,
				source, is_external, is_approved, organization_id, created_at, updated_at`,
			req.Title, req.Description, req.Company, req.Location, req.SalaryRange, req.JobType, req.URL,
			"internal", false, role == "admin", organizationID,
		).Scan(
			&job.ID, &job.Title, &job.Description, &job.Company, &job.Location,
			&job.SalaryRange, &job.JobType, &job.URL, &job.Source, &job.IsExternal,
			&job.IsApproved, &job.OrganizationID, &job.CreatedAt, &job.UpdatedAt,
		)
		if err != nil {
			http.Error(w, "Error creating job", http.StatusInternalServerError)
			return
		}
		
		// Return job
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(job)
	}
}

// updateJobHandler handles updating a job
func updateJobHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Get user ID from context
		userID := r.Context().Value("user_id").(int)
		role := r.Context().Value("role").(string)
		
		// Get job ID from URL
		vars := mux.Vars(r)
		id, err := strconv.Atoi(vars["id"])
		if err != nil {
			http.Error(w, "Invalid job ID", http.StatusBadRequest)
			return
		}
		
		// Parse request body
		var req JobRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			return
		}
		
		// Validate request
		if req.Title == "" || req.Description == "" || req.Company == "" {
			http.Error(w, "Missing required fields", http.StatusBadRequest)
			return
		}
		
		// Check if job exists and user has permission to update it
		var jobOrganizationID *int
		var isExternal bool
		err = db.QueryRow("SELECT organization_id, is_external FROM jobs WHERE id = $1", id).Scan(&jobOrganizationID, &isExternal)
		if err != nil {
			if err == sql.ErrNoRows {
				http.Error(w, "Job not found", http.StatusNotFound)
			} else {
				http.Error(w, "Database error", http.StatusInternalServerError)
			}
			return
		}
		
		// Check if user has permission to update the job
		if role == "organization" {
			var organizationID int
			err := db.QueryRow("SELECT id FROM organizations WHERE user_id = $1", userID).Scan(&organizationID)
			if err != nil {
				http.Error(w, "Database error", http.StatusInternalServerError)
				return
			}
			
			if jobOrganizationID == nil || *jobOrganizationID != organizationID {
				http.Error(w, "Unauthorized", http.StatusForbidden)
				return
			}
		} else if role != "admin" {
			http.Error(w, "Unauthorized", http.StatusForbidden)
			return
		}
		
		// Update job in database
		_, err = db.Exec(
			`UPDATE jobs SET
				title = $1, description = $2, company = $3, location = $4,
				salary_range = $5, job_type = $6, url = $7, updated_at = NOW()
			WHERE id = $8`,
			req.Title, req.Description, req.Company, req.Location,
			req.SalaryRange, req.JobType, req.URL, id,
		)
		if err != nil {
			http.Error(w, "Error updating job", http.StatusInternalServerError)
			return
		}
		
		// Get updated job
		var job Job
		err = db.QueryRow(
			"SELECT id, title, description, company, location, salary_range, job_type, url, source, is_external, is_approved, organization_id, created_at, updated_at FROM jobs WHERE id = $1",
			id,
		).Scan(
			&job.ID, &job.Title, &job.Description, &job.Company, &job.Location,
			&job.SalaryRange, &job.JobType, &job.URL, &job.Source, &job.IsExternal,
			&job.IsApproved, &job.OrganizationID, &job.CreatedAt, &job.UpdatedAt,
		)
		if err != nil {
			http.Error(w, "Error retrieving updated job", http.StatusInternalServerError)
			return
		}
		
		// Return job
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(job)
	}
}

// deleteJobHandler handles deleting a job
func deleteJobHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Get user ID from context
		userID := r.Context().Value("user_id").(int)
		role := r.Context().Value("role").(string)
		
		// Get job ID from URL
		vars := mux.Vars(r)
		id, err := strconv.Atoi(vars["id"])
		if err != nil {
			http.Error(w, "Invalid job ID", http.StatusBadRequest)
			return
		}
		
		// Check if job exists and user has permission to delete it
		var jobOrganizationID *int
		err = db.QueryRow("SELECT organization_id FROM jobs WHERE id = $1", id).Scan(&jobOrganizationID)
		if err != nil {
			if err == sql.ErrNoRows {
				http.Error(w, "Job not found", http.StatusNotFound)
			} else {
				http.Error(w, "Database error", http.StatusInternalServerError)
			}
			return
		}
		
		// Check if user has permission to delete the job
		if role == "organization" {
			var organizationID int
			err := db.QueryRow("SELECT id FROM organizations WHERE user_id = $1", userID).Scan(&organizationID)
			if err != nil {
				http.Error(w, "Database error", http.StatusInternalServerError)
				return
			}
			
			if jobOrganizationID == nil || *jobOrganizationID != organizationID {
				http.Error(w, "Unauthorized", http.StatusForbidden)
				return
			}
		} else if role != "admin" {
			http.Error(w, "Unauthorized", http.StatusForbidden)
			return
		}
		
		// Delete job from database
		_, err = db.Exec("DELETE FROM jobs WHERE id = $1", id)
		if err != nil {
			http.Error(w, "Error deleting job", http.StatusInternalServerError)
			return
		}
		
		// Return success
		w.WriteHeader(http.StatusNoContent)
	}
}
