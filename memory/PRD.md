# BurgerNetz - Product Requirements Document

## Original Problem Statement
BurgerNetz is a web platform where the citizens of the city can report problems in the city to the government. People can report things like potholes, broken streetlights, garbage issues or any other problems. The platform also lets them track the status of their reports so they know when the issue is fixed. The system shows reports on a city map, helping everyone see where problems are most common. It also organizes issues automatically, so the city administration can prioritize and solve them faster. An analytics dashboard shows trends and areas that need attention.

## User Choices
- Tech Stack: React + FastAPI + MongoDB
- Mapping: OpenStreetMap/Leaflet (no API key required)
- Authentication: JWT-based email/password auth
- User Role: Single citizen role for reporting
- Photo Upload: Required for issue reports

## User Personas
1. **Citizen** - Reports city issues, tracks status, views map and analytics
2. **Visitor** - Views map and analytics without login

## Core Requirements (Static)
- User registration and login
- Issue reporting with categories (pothole, streetlight, garbage, graffiti, other)
- Photo upload for issues
- Location marking on map
- Issue status tracking (pending, in_progress, resolved)
- Interactive city map with issue markers
- Analytics dashboard with trends

## Architecture
- **Frontend**: React 19 with React Router, Tailwind CSS, Shadcn UI
- **Backend**: FastAPI with JWT auth, Motor (async MongoDB driver)
- **Database**: MongoDB
- **Map**: Leaflet with OpenStreetMap tiles
- **Charts**: Recharts

## What's Been Implemented (December 2024)
- [x] User authentication (register, login, JWT)
- [x] Issue CRUD operations
- [x] Photo upload (base64 encoding)
- [x] Interactive map view with OpenStreetMap/Leaflet
- [x] Category/status filtering on map
- [x] Issue details page
- [x] My Reports page
- [x] Analytics dashboard with charts
- [x] Responsive design with Manrope/Inter fonts
- [x] Status badges and category indicators

## Prioritized Backlog

### P0 (Critical) - DONE
- [x] MVP complete with all core features

### P1 (High Priority)
- [ ] Admin role for government officials
- [ ] Email notifications on status changes
- [ ] Image compression before upload
- [ ] Comment system on issues

### P2 (Medium Priority)
- [ ] Issue upvoting/voting system
- [ ] Search functionality
- [ ] Export reports to CSV
- [ ] Real-time notifications

### P3 (Low Priority)
- [ ] Dark mode support
- [ ] Multi-language support
- [ ] Push notifications
- [ ] Social sharing

## Next Tasks
1. Add admin role for government to manage issues
2. Implement email notifications
3. Add comment system on issues
4. Image compression for better performance
