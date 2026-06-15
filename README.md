# Cold Email Health Analyzer

A health analyzer for cold outreach emails that checks for personalization, spam triggers, links, and excessive capitalization, saving scan results to a MySQL database.

## Prerequisites

- Node.js (v18 or higher)
- Docker and Docker Compose

## Repository Structure

- `/frontend` - Next.js web application
- `/backend` - NestJS API server
- `docker-compose.yml` - MySQL database container configuration

## Setup and Installation

### 1. Database
Start the MySQL database container:
```bash
docker compose up -d
```

### 2. Backend API
Navigate to the backend directory, install dependencies, run migrations, and start the development server:
```bash
cd backend
npm install
npm run migrate
npm run start:dev
```
The backend API will run on http://localhost:5001.

### 3. Frontend Web App
Navigate to the frontend directory, install dependencies, and start the development server:
```bash
cd ../frontend
npm install
npm run dev
```
The frontend application will run on http://localhost:3000.

## Database Access

To inspect the scan results saved in the `email_scans` table, run:
```bash
docker exec -it email_analyzer_db mysql -u app_user -papppassword -e "SELECT * FROM email_scans;" email_analytics
```

### Database Credentials
- **Host**: localhost
- **Port**: 3306
- **Username**: app_user
- **Password**: apppassword
- **Database**: email_analytics
