# Eventora — Event & Workshop Management Portal

A full-stack web application for managing events and workshops, built with React, Node.js, Express, and PostgreSQL.

## Features

- Browse and search events.
- Filter events by category and sort event listings.
- View event details and registration counts.
- Register for events with form validation.
- Prevent duplicate registrations and enforce event capacity.
- Admin dashboard with event statistics.
- Create, update, and delete events.
- View registrations for individual events.
- Responsive design for desktop and mobile screens.

## Tech Stack

**Frontend:** React, Vite, JavaScript, CSS  
**Backend:** Node.js, Express.js  
**Database:** PostgreSQL  
**API:** REST API

## Project Structure

```text
EventWorkshopPortal/
├── client/       # React frontend
└── server/       # Express backend and database integration
```

## Getting Started

### Prerequisites

- Node.js and npm
- PostgreSQL

### 1. Clone the repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
cd EventWorkshopPortal
```

Replace `YOUR_GITHUB_REPOSITORY_URL` with your repository's actual URL.

### 2. Start the backend

```bash
cd server
npm install
```

Create a `.env` file in the `server` directory with your local PostgreSQL connection settings:

```env
PORT=5000
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/event_workshop_portal
```

Replace `YOUR_PASSWORD` with your own local PostgreSQL password. Never publish your real password.

Start the backend using the start command configured in `server/package.json`.

### 3. Start the frontend

Open a second terminal:

```bash
cd client
npm install
npm run dev
```

Open the local URL displayed by Vite, usually `http://localhost:5173`.

## Admin Dashboard

Open `http://localhost:5173/#admin` to access the admin dashboard.

## Security Note

Keep `.env` files and database credentials private. Do not commit passwords, API secrets, or other sensitive information.

## Future Improvements

- User authentication and role-based access control
- Event image uploads
- Email registration confirmations
- Deployment to a cloud hosting platform
