# Quizzing AI Camera Integration - Online Examination Platform

Online examination web platform featuring client-side AI face proctoring, server-authoritative timing, strict data isolation, and anti-cheat monitoring.

## Project Structure
- `backend/`: Node.js, Express, MongoDB Mongoose, Socket.io Realtime Server.
- `frontend/`: React 19, Vite, React Router, Proctoring Exam Interface.
- `ai-scanning/`: Standalone AI face scanning & anti-cheat module.

## Quick Start (Run Both Together)

1. **Install root dependencies:**
   ```bash
   npm install
   ```

2. **Configure Backend:**
   - In `backend/.env`, configure your `MONGO_URI` (see `backend/.env.example`).
   - Run seed script (optional):
     ```bash
     npm run seed
     ```

3. **Start both Backend (Port 5000) and Frontend (Port 5173):**
   ```bash
   npm run dev
   ```

## Demo Credentials (Password: `123456`)
- **Admin:** `admin`
- **Teacher:** `thayhung` (Class 12A1) | `colan` (Class 12A2)
- **Student:** `hocsinhan` (Class 12A1) | `hocsinhcuong` (Class 12A2)
