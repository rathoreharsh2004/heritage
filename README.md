# Rathore Heritage Developers — Custom Dynamic CMS & Admin Panel

A custom-engineered, full-stack Content Management System (CMS) and Admin Panel designed specifically for the authentic architectural and luxury heritage portfolio of **Rathore Heritage Developers**.

---

## 🏛️ System Architecture

```
                                  ┌────────────────────────┐
                                  │      ADMIN PANEL       │
                                  │   (Luxury Themed SPA)  │
                                  │       at /admin/       │
                                  └───────────┬────────────┘
                                              │ JWT Auth & REST API
                                              ▼
┌────────────────────────┐        ┌────────────────────────┐
│     PUBLIC WEBSITE     │ ──────▶│      EXPRESS API       │
│  (Dynamic Live Sync)   │◀────── │ (Routes, Auth, GridFS) │
│       at /             │        └───────────┬────────────┘
└────────────────────────┘                    │ Mongoose ODM & GridFS Streams
                                              ▼
                                  ┌────────────────────────┐
                                  │        MONGODB         │
                                  │ (Collections & GridFS) │
                                  └────────────────────────┘
```

---

## 🚀 Quick Start Guide

### 1. Installation & Dependencies
Ensure you have **Node.js (v18+)** installed. In the project root, run:
```bash
npm install
```

### 2. Environment Configuration
Copy the provided `.env.example` to `.env` (or customize as needed):
```bash
cp .env.example .env
```
Default `.env` configuration:
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/rathore_heritage
JWT_SECRET=rathore_heritage_secret_jwt_key_2026_secure
JWT_EXPIRES_IN=7d
INITIAL_ADMIN_USERNAME=admin
INITIAL_ADMIN_EMAIL=admin@rathoreheritage.com
INITIAL_ADMIN_PASSWORD=Admin@123456
CLIENT_URL=http://localhost:5000
```
> **Zero-Setup Guarantee**: If an external MongoDB instance is not detected on port 27017, the server automatically boots an embedded local database so the site and admin panel function immediately out of the box.

### 3. Database Migration & Initial Seeding
To populate MongoDB with all authentic website texts, sections, projects, materials, leaders, and GridFS media assets:
```bash
npm run seed
```

### 4. Start the Application Server
Run the unified Express and CMS server:
```bash
npm start
```
Or for live code reload in development:
```bash
npm run dev
```

---

## 🛡️ Admin Portal Credentials

- **Admin URL**: `http://localhost:5000/admin/`
- **Initial Username/Email**: `admin@rathoreheritage.com` (or `admin`)
- **Initial Password**: `Admin@123456`

*(Admin password can be updated directly from the Admin Panel top-bar profile modal).*

---

## 📋 Website Content Model (Specifically Mapped to This Website)

The CMS navigation and database schemas directly reflect the structure of this website:

| Section / Entity | MongoDB Collection | Description |
| :--- | :--- | :--- |
| **Brand & Settings** | `websitesettings` | Company name, logo, phones, WhatsApp number, email, Instagram URL, footer text |
| **Sections & Copy** | `pagesections` | Keyed texts for Hero, Legacy, Leadership, Shilp Kala, Palette, Consultancy, Raw Materials, Darbar, Principles, Services |
| **Signature Projects** | `projects` | Oladar Haveli, Roop Mahal, Mohan Villa, First Impression Salon (Sub-pages, location, type, hero, narrative paragraphs, 10–25 gallery photos) |
| **Shilp Kala (Craftsmanship)** | `craftsmanships` | 10 palace-style craft cards (Elevations, Doors, Jharokhas, Stone, Pipla Patti, Thekri Glass, Marble, Domes, Chandeliers, Interiors) with sub-galleries |
| **Leadership Team** | `leaders` | Balveer Singh Rathore (Founder & CMD) and Yashvardhan Singh Rathore (MD & Civil Engineer) |
| **The Royal Material Palette** | `materialelements` | M1 to M8 traditional building elements with alternating square & dome shapes |
| **Foundation of Heritage** | `rawmaterials` | 11 raw material image/video slides with headlines and counters |
| **Darbar Gallery** | `darbarslides` | 10 Oladar Haveli curated showcase slides with headlines and narratives |
| **What We Offer** | `serviceoffers` | 5 core development offerings (Havelis, Villas, Farmhouses, Hotels & Resorts, Commercial Interiors) |
| **Client Enquiries** | `enquiries` | Real-time inbound customer project submissions from the website contact form |
| **Media Library** | `media` + GridFS `mediaFiles` | Binary media stored in MongoDB GridFS with usage verification before deletion |
| **Audit Log** | `auditlogs` | Detailed history of CMS modifications (Admin, Action, Entity, Changes) |

---

## 📡 Complete REST API Documentation

### Public Endpoints (Consumed by Website)
- `GET /api/content` — Fetches complete aggregated website content (settings, sections, projects, crafts, materials, leaders, slides, services).
- `GET /api/settings` — Fetches general company branding and contact details.
- `GET /api/sections` — Fetches all page sections.
- `GET /api/sections/:key` — Fetches a specific section (e.g. `hero`, `legacy`, `consultancy`).
- `GET /api/projects` — Lists all projects.
- `GET /api/projects/:id` — Gets a single project.
- `GET /api/craftsmanship` — Lists all 10 craftsmanship cards and their sub-images.
- `GET /api/materials` — Lists royal material elements M1 to M8.
- `GET /api/media/:id` — Streams a binary image or video file directly from MongoDB GridFS.
- `GET /api/media/file/:filename` — Streams a media file by filename from GridFS.
- `POST /api/enquiries` — Submits a client inquiry into MongoDB.
- `GET /api/health` — Checks database connectivity status.

### Protected Admin Endpoints (Require `Bearer <JWT_TOKEN>`)
- `POST /api/auth/login` — Authenticates admin and returns JWT token.
- `GET /api/auth/me` — Gets current authenticated admin user profile.
- `POST /api/auth/change-password` — Updates admin password.
- `GET /api/dashboard` — Returns real-time metrics, counts, and recent activities.
- `PUT /api/settings` — Updates website settings.
- `PUT /api/sections/:key` — Updates a specific page section.
- `POST /api/projects`, `PUT /api/projects/:id`, `DELETE /api/projects/:id` — Project CRUD.
- `POST /api/craftsmanship`, `PUT /api/craftsmanship/:id`, `DELETE /api/craftsmanship/:id` — Craftsmanship CRUD.
- `POST /api/leaders`, `PUT /api/leaders/:id`, `DELETE /api/leaders/:id` — Leadership CRUD.
- `POST /api/materials`, `PUT /api/materials/:id`, `DELETE /api/materials/:id` — Materials CRUD.
- `POST /api/rawmaterials`, `PUT /api/rawmaterials/:id`, `DELETE /api/rawmaterials/:id` — Raw Materials CRUD.
- `POST /api/darbar`, `PUT /api/darbar/:id`, `DELETE /api/darbar/:id` — Darbar Gallery CRUD.
- `POST /api/services`, `PUT /api/services/:id`, `DELETE /api/services/:id` — Services CRUD.
- `GET /api/enquiries` — Lists client inquiries with status filtering.
- `PUT /api/enquiries/:id` — Updates inquiry status (`New`, `Contacted`, `In-Progress`, `Closed`) or notes.
- `DELETE /api/enquiries/:id` — Deletes an inquiry.
- `GET /api/media` — Lists media files with category and search filtering.
- `GET /api/media/:id/usage` — Verifies live database references for a media item.
- `POST /api/media/upload` — Uploads binary file directly into MongoDB GridFS.
- `PUT /api/media/:id` — Updates media metadata (alt text, category).
- `DELETE /api/media/:id` — Deletes media file from GridFS (with usage confirmation).
- `GET /api/audit-logs` — Lists administrative action audit history.

---

## 🌐 Production Deployment

1. Set `NODE_ENV=production` in `.env`.
2. Set your production MongoDB Atlas URI:
   ```env
   MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/rathore_heritage?retryWrites=true&w=majority
   ```
3. Set a strong `JWT_SECRET`.
4. Run migrations/seed once: `npm run seed`.
5. Run using a process manager like PM2:
   ```bash
   pm2 start server/index.js --name "rathore-heritage"
   ```
