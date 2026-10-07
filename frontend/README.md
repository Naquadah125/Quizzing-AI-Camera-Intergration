# Frontend - Quizzing Exam Platform (AI Proctoring)

## Prerequisites
- Node.js (v18+)
- Backend running on `http://localhost:5000`

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm run dev
   ```
   Application will be available at **http://localhost:5173**.

3. **Build for production:**
   ```bash
   npm run build
   ```

## Key Features
- **Role-based Authentication:** Student, Teacher, and Admin dashboards.
- **AI Proctoring:** Camera permission check, client-side face detection, and tab/fullscreen violation monitoring.
- **Exam Engine:** Single choice with Pin Position (Option D pinned), server-authoritative timer, and offline sync recovery.
