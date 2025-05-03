# Job Aggregator

A comprehensive job aggregator platform that collects job listings from external job sites using web scraping tools, stores them in a database, and displays them in a user-friendly dashboard.

## Features

- **Profile Management**: User (candidate, organization) and admin profiles
- **Job Posting**: Organizations can post jobs
- **Bookmarking**: Candidates can bookmark jobs and create reminders
- **Search/Filter**: Advanced search and filtering options
- **Admin Panel**: Manage all listings (approve/reject/delete)
- **Cron Jobs**: Periodic scraping of external job sites

## Tech Stack

- **Backend**: Go
- **Database**: PostgreSQL
- **Frontend**: Next.js (React)
- **Web Scraping**: Go libraries

## Project Structure

```
job-aggregator/
├── backend/               # Go backend
│   ├── cmd/               # Main application entry point
│   ├── pkg/               # Reusable packages
│   ├── internal/          # Internal packages
│   │   ├── auth/          # Authentication service
│   │   ├── job/           # Job service
│   │   ├── user/          # User service
│   │   ├── organization/  # Organization service
│   │   ├── admin/         # Admin service
│   │   ├── notification/  # Notification service
│   │   └── scraper/       # Web scraper service
│   ├── config/            # Configuration files
│   └── Dockerfile         # Backend Docker configuration
├── frontend/              # Next.js frontend
│   ├── src/               # Source code
│   │   ├── app/           # Next.js app directory
│   │   ├── components/    # React components
│   │   ├── contexts/      # React contexts
│   │   └── lib/           # Utility functions and API clients
│   └── Dockerfile         # Frontend Docker configuration
├── docker-compose.yml     # Docker Compose configuration
└── README.md              # Project documentation
```

## Getting Started

### Prerequisites

- Docker and Docker Compose
- Go 1.20 or higher (for local development)
- Node.js 18 or higher (for local development)
- PostgreSQL (for local development)

### Running with Docker

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/job-aggregator.git
   cd job-aggregator
   ```

2. Start the application using Docker Compose:
   ```bash
   docker-compose up
   ```

3. Access the application:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8080

### Local Development

#### Backend

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   go mod download
   ```

3. Set up environment variables:
   ```bash
   export DB_HOST=localhost
   export DB_PORT=5432
   export DB_USER=postgres
   export DB_PASSWORD=postgres
   export DB_NAME=job_aggregator
   export PORT=8080
   ```

4. Run the application:
   ```bash
   go run cmd/main.go
   ```

#### Frontend

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env.local` file with the following content:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:8080/api
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Access the frontend at http://localhost:3000

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login a user

### Jobs

- `GET /api/jobs` - Get all jobs
- `GET /api/jobs/:id` - Get a specific job
- `POST /api/jobs` - Create a new job (requires authentication)
- `PUT /api/jobs/:id` - Update a job (requires authentication)
- `DELETE /api/jobs/:id` - Delete a job (requires authentication)

### Users

- `GET /api/user/profile` - Get user profile (requires authentication)
- `PUT /api/user/profile` - Update user profile (requires authentication)
- `GET /api/user/bookmarks` - Get user bookmarks (requires authentication)
- `POST /api/user/bookmarks` - Add a bookmark (requires authentication)
- `DELETE /api/user/bookmarks/:id` - Remove a bookmark (requires authentication)
- `GET /api/user/reminders` - Get user reminders (requires authentication)
- `POST /api/user/reminders` - Add a reminder (requires authentication)
- `PUT /api/user/reminders/:id` - Update a reminder (requires authentication)
- `DELETE /api/user/reminders/:id` - Delete a reminder (requires authentication)

### Organizations

- `GET /api/organization/profile` - Get organization profile (requires authentication)
- `PUT /api/organization/profile` - Update organization profile (requires authentication)
- `GET /api/organization/jobs` - Get organization jobs (requires authentication)

### Admin

- `GET /api/admin/users` - Get all users (requires admin authentication)
- `PUT /api/admin/users/:id` - Update a user (requires admin authentication)
- `DELETE /api/admin/users/:id` - Delete a user (requires admin authentication)
- `GET /api/admin/jobs` - Get all jobs (requires admin authentication)
- `PUT /api/admin/jobs/:id/approve` - Approve a job (requires admin authentication)
- `PUT /api/admin/jobs/:id/reject` - Reject a job (requires admin authentication)
- `DELETE /api/admin/jobs/:id` - Delete a job (requires admin authentication)
- `GET /api/admin/organizations` - Get all organizations (requires admin authentication)
- `PUT /api/admin/organizations/:id` - Update an organization (requires admin authentication)
- `DELETE /api/admin/organizations/:id` - Delete an organization (requires admin authentication)

## License

This project is licensed under the MIT License - see the LICENSE file for details.
