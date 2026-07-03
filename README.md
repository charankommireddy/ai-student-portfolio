# B.Tech AI Student Portfolio (Full-Stack Express + React)

A modern, responsive, and production-ready Personal Portfolio Website for a Computer Science (Artificial Intelligence) student. Styled with a premium dark-mode visual signature, glassmorphism card panels, smooth transitions, and equipped with a full-stack admin dashboard.

---

## 🛠️ Technology Stack
* **Frontend:** React 19, Vite, Tailwind CSS v4, Lucide Icons, Custom Keyframe Motion.
* **Backend:** Node.js, Express.js.
* **Database:** MongoDB with Mongoose (with dynamic local JSON fallback for zero-configuration previewing!).
* **Authentication:** Stateless JSON Web Tokens (JWT) & Bcrypt password hashing.

---

## 📂 Folder Structure
```text
portfolio/
├── server/                     # Express.js Backend Modules
│   ├── config/                 # Dynamic Storage Configuration
│   ├── data/                   # Persistent Local JSON files (sandbox fallback)
│   ├── middleware/             # Admin Authentication (verifyAdminToken)
│   ├── routes/                 # REST API Endpoints (/api/projects, /api/auth, etc.)
│   └── services/               # Mongoose & Local Database Adapters
├── src/                        # React.js Client Codebase
│   ├── components/             # Reusable UI (Navbar, Footer, ProjectCard, Toast)
│   ├── pages/                  # Portfolio sections & Admin control centers
│   ├── services/               # apiService (Relative path endpoints)
│   ├── types.ts                # TypeScript Interfaces
│   ├── index.css               # Tailwind CSS imports & @theme configurations
│   └── main.tsx                # Client app mounting point
├── server.ts                   # Master Entry Point (Express + Vite Server)
├── package.json                # Project Manifest & scripts
└── README.md                   # System Documentation
```

---

## 🔧 Installation & Local Setup

### Prerequisites
* Node.js (v18 or higher recommended)
* NPM or Yarn

### Step-by-Step Run Steps
1. **Clone or Extract the Workspace Codebase**
2. **Install Dependencies**
   ```bash
   npm install
   ```
3. **Configure Environment Variables**
   Create a `.env` file in the root directory (based on `.env.example`):
   ```env
   # Database Credentials
   MONGODB_URI="mongodb+srv://<username>:<password>@cluster.mongodb.net/portfolio"
   JWT_SECRET="my-super-secret-jwt-key"
   ADMIN_USERNAME="admin"
   ADMIN_PASSWORD="admin123"
   ```
   *Note: If no `MONGODB_URI` is provided, the application will automatically initialize a sandbox JSON database at `server/data/db.json` so you can test all features offline instantly!*

4. **Launch the Development Server**
   ```bash
   npm run dev
   ```
   *This Boots Express on Port 3000, which hosts our API endpoints and proxies Vite middleware for HMR-less client previews.*

5. **Build for Production**
   ```bash
   npm run build
   ```

6. **Start Compiled Server**
   ```bash
   npm run start
   ```

---

## ☁️ MongoDB Atlas Configuration

To migrate from Sandbox mode to a real live Cloud MongoDB Atlas Database:
1. Register a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create a free shared cluster (M0) and select your cloud provider/region.
3. In **Database Access**, create a user with "Read and Write to any Database" permissions.
4. In **Network Access**, choose "Allow Access from Anywhere" (`0.0.0.0/0`) or add the IP address of your Render hosting service.
5. In **Database Connect**, select **Drivers**, copy the Connection String, replace `<username>` and `<password>` with your created database credentials, and paste it into your `MONGODB_URI` environment variable.

---

## 📝 REST API Documentation

All endpoints are prefix-mounted under `/api/*`.

### Public Endpoints
* **`GET /api/projects`**: Fetches all projects in reverse-chronological order.
* **`GET /api/certificates`**: Fetches all logged certificates.
* **`POST /api/contact`**: Submits a contact form message. Checks email validity and stores message in DB.
* **`GET /api/db-status`**: Returns current database mode (`mongodb` or `local`).

### Admin Authentication
* **`POST /api/auth/login`**: Authenticate administrator.
  * *Request Body:* `{ "username": "admin", "password": "yourpassword" }`
  * *Returns:* `{ "token": "JWT_TOKEN", "admin": { "username": "admin" } }`

### Secured Endpoints (Requires `Authorization: Bearer <token>` Header)
* **`GET /api/auth/me`**: Validates JWT token and reports active user.
* **`POST /api/projects`**: Registers a new project. Supports Base64 images.
* **`PUT /api/projects/:id`**: Modifies project properties.
* **`DELETE /api/projects/:id`**: Removes project from database.
* **`POST /api/certificates`**: Registers a new certificate.
* **`DELETE /api/certificates/:id`**: Removes a certificate.
* **`GET /api/contact`**: Pulls all message submissions from the inbox.
* **`DELETE /api/contact/:id`**: Clears contact message.

---

## 🚀 Deployment Guide

### Option 1: Full-Stack Container Deployment (Render, Cloud Run, etc.) - Recommended
Since this app is bundled into a single unified Express server hosting both the static HTML files and API routes, you can host the entire app on a single Render "Web Service" or Google Cloud Run service!
1. Link your GitHub repository to **Render**.
2. Create a new **Web Service**.
3. Configure the following settings:
   * **Runtime:** `Node`
   * **Build Command:** `npm install && npm run build`
   * **Start Command:** `npm run start`
4. Register your environment variables (`MONGODB_URI`, `JWT_SECRET`, etc.) in the **Environment** settings panel.

### Option 2: Split Deploy (Vercel Frontend + Render Backend)
If you prefer splitting the frontend from the server:

#### Backend (Render)
1. In your Render service, specify the start entry point to only boot the Express application.
2. Ensure CORS is fully enabled (which we've done by using the `cors` package in `server.ts`).

#### Frontend (Vercel)
1. Connect your repo to **Vercel**.
2. Select the framework preset as **Vite**.
3. Set your **Build Command** to `vite build` and **Output Directory** to `dist`.
4. In your React frontend, configure the base API URL to point directly to your deployed Render URL (e.g. `https://your-api.onrender.com/api`).
