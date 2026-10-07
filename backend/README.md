# Backend - Online Examination System

## Prerequisites
- Node.js (v18+)
- MongoDB Atlas or local MongoDB instance

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   - Copy `.env.example` to `.env`:
     ```bash
     cp .env.example .env
     ```
   - Update `MONGO_URI` in `.env` with your MongoDB connection string.

3. **Seed demo data (Optional but recommended):**
   ```bash
   npm run seed
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```
   Server runs on **http://localhost:5000** (Health check: `/api/health`).

## Default Demo Accounts (Password: `123456`)
- **Admin:** `admin`
- **Teacher:** `thayhung` (Class 12A1) | `colan` (Class 12A2)
- **Student:** `hocsinhan` (Class 12A1) | `hocsinhcuong` (Class 12A2)
