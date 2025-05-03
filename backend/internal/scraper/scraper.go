package scraper

import (
	"database/sql"
	"fmt"
	"log"

	"github.com/jasonlvhit/gocron"
)

// ScrapedJob represents a job scraped from an external source
type ScrapedJob struct {
	Title       string
	Description string
	Company     string
	Location    string
	SalaryRange string
	JobType     string
	URL         string
	Source      string
}

// StartScheduler starts the web scraper scheduler
func StartScheduler(db *sql.DB) {
	// Initialize scheduler
	s := gocron.NewScheduler()

	// Schedule scraping jobs
	s.Every(12).Hours().Do(func() {
		log.Println("Starting scheduled job scraping...")
		err := scrapeAllSources(db)
		if err != nil {
			log.Printf("Error scraping jobs: %v\n", err)
		}
	})

	// Start scheduler
	<-s.Start()
}

// scrapeAllSources scrapes all active sources
func scrapeAllSources(db *sql.DB) error {
	// Get all active sources
	rows, err := db.Query("SELECT id, name, url FROM scraped_sources WHERE is_active = true")
	if err != nil {
		return fmt.Errorf("error getting sources: %w", err)
	}
	defer rows.Close()

	// Scrape each source
	for rows.Next() {
		var id int
		var name, url string
		err := rows.Scan(&id, &name, &url)
		if err != nil {
			return fmt.Errorf("error scanning source: %w", err)
		}

		// Scrape source
		log.Printf("Scraping source: %s (%s)\n", name, url)
		jobs, err := scrapeSource(name, url)
		if err != nil {
			log.Printf("Error scraping source %s: %v\n", name, err)
			continue
		}

		// Save jobs to database
		for _, job := range jobs {
			err := saveJob(db, job)
			if err != nil {
				log.Printf("Error saving job: %v\n", err)
			}
		}

		// Update last scraped time
		_, err = db.Exec("UPDATE scraped_sources SET last_scraped_at = NOW() WHERE id = $1", id)
		if err != nil {
			log.Printf("Error updating last scraped time: %v\n", err)
		}
	}

	return nil
}

// scrapeSource scrapes a single source
func scrapeSource(name, url string) ([]ScrapedJob, error) {
	// This is a placeholder for actual scraping logic
	// In a real implementation, this would use a library like Colly or Goquery
	// to scrape job listings from the source

	switch name {
	case "indeed":
		return scrapeIndeed(url)
	case "linkedin":
		return scrapeLinkedIn(url)
	default:
		return nil, fmt.Errorf("unsupported source: %s", name)
	}
}

// scrapeIndeed scrapes jobs from Indeed
func scrapeIndeed(url string) ([]ScrapedJob, error) {
	// This is a placeholder for actual Indeed scraping logic
	// In a real implementation, this would use a library like Colly or Goquery

	// For demonstration purposes, return some dummy data
	return []ScrapedJob{
		{
			Title:       "Software Engineer",
			Description: "We are looking for a software engineer to join our team...",
			Company:     "Example Corp",
			Location:    "Remote",
			SalaryRange: "$100,000 - $150,000",
			JobType:     "Full-time",
			URL:         "https://indeed.com/job/123",
			Source:      "indeed",
		},
		{
			Title:       "Frontend Developer",
			Description: "Join our team as a frontend developer...",
			Company:     "Tech Solutions",
			Location:    "New York, NY",
			SalaryRange: "$90,000 - $120,000",
			JobType:     "Full-time",
			URL:         "https://indeed.com/job/456",
			Source:      "indeed",
		},
	}, nil
}

// scrapeLinkedIn scrapes jobs from LinkedIn
func scrapeLinkedIn(url string) ([]ScrapedJob, error) {
	// This is a placeholder for actual LinkedIn scraping logic
	// In a real implementation, this would use a library like Colly or Goquery

	// For demonstration purposes, return some dummy data
	return []ScrapedJob{
		{
			Title:       "Senior Software Engineer",
			Description: "We are seeking a senior software engineer...",
			Company:     "Big Tech Inc",
			Location:    "San Francisco, CA",
			SalaryRange: "$150,000 - $200,000",
			JobType:     "Full-time",
			URL:         "https://linkedin.com/jobs/view/789",
			Source:      "linkedin",
		},
		{
			Title:       "Product Manager",
			Description: "Join our product team...",
			Company:     "Startup Co",
			Location:    "Austin, TX",
			SalaryRange: "$120,000 - $160,000",
			JobType:     "Full-time",
			URL:         "https://linkedin.com/jobs/view/012",
			Source:      "linkedin",
		},
	}, nil
}

// saveJob saves a scraped job to the database
func saveJob(db *sql.DB, job ScrapedJob) error {
	// Check if job already exists (by URL)
	var count int
	err := db.QueryRow("SELECT COUNT(*) FROM jobs WHERE url = $1", job.URL).Scan(&count)
	if err != nil {
		return fmt.Errorf("error checking for existing job: %w", err)
	}
	if count > 0 {
		// Job already exists, skip
		return nil
	}

	// Insert job into database
	_, err = db.Exec(
		`INSERT INTO jobs (
			title, description, company, location, salary_range, job_type, url,
			source, is_external, is_approved
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
		job.Title, job.Description, job.Company, job.Location, job.SalaryRange, job.JobType, job.URL,
		job.Source, true, true,
	)
	if err != nil {
		return fmt.Errorf("error inserting job: %w", err)
	}

	return nil
}
