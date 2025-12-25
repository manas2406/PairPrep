## Phase 1 – Frontend Basics

- Created initial PairPrep UI using Next.js
- Implemented fake matchmaking flow using React state
- Focused on UI flow before introducing backend or real-time logic
- Added Next.js pages for match and room
- Implemented client-side navigation using `useRouter`
- Modeled full user flow before backend integration

### Phase 2 – Backend Basics

- Set up Express server
- Added JSON middleware
- Created initial matchmaking API: POST /match/start
- Verified backend works independently from frontend
### CORS Handling
- Encountered browser CORS issue when connecting frontend and backend
- Fixed by enabling CORS middleware in Express
- Learned difference between browser requests and Postman

- Refactored backend into routes and controllers
- Separated business logic from routing
- Prepared backend structure for future scalability
### In-Memory Matchmaking
- Implemented basic matchmaking using in-memory state
- First request enters queue, second request matches
- Used this as a stepping stone before Redis integration

### Phase 3 – Real-Time Matchmaking

- Integrated Socket.IO for real-time communication
- Replaced polling with server-pushed match events
- Implemented event-driven matchmaking flow

### Phase 4 – Redis Matchmaking

- Integrated Redis for matchmaking queues
- Implemented atomic FIFO matching using Redis lists
- Prevented self-matching and duplicate entries
- Prepared system for horizontal scaling
<!-- 
### Phase 5 – 
-added in-memory matchmaking -->

### Phase 6.2A – User Profiles & CF Handle

- Added in-memory user store
- Required Codeforces handle at signup
- Prepared system for solved-problem exclusion

### Phase 6.2B – Codeforces Solved Problem Fetching

- Integrated Codeforces user.status API
- Extracted accepted problem IDs
- Cached solved problems per user
- Prepared exclusion logic for question selection

### Phase 6.2C – Solved Problem Exclusion

- Extended problem selector to exclude solved problems
- Combined solved history of both users
- Ensured assigned problem is new for both participants

### Phase 6.3 – User ↔ Socket Mapping

- Bound users to sockets during WebSocket handshake
- Introduced bidirectional socket-user mapping
- Removed hardcoded user identities
- Enabled correct problem exclusion per match

### Phase 6.4 – Submission & Result UI

- Clearly modeled match lifecycle states
- Integrated external submission verification
- Provided real-time feedback and result display

### Phase 7.1 – MongoDB Integration

- Integrated MongoDB Atlas as the primary persistent database
- Moved all configuration (ports, DB URI, secrets) to environment variables
- Established stable database connection using Mongoose
- Eliminated reliance on volatile in-memory storage for core data

### Phase 7.2 – Persistent User Model

- Designed MongoDB User schema for usernames, Codeforces handles, passwords, and solved problems
- Migrated signup flow from in-memory store to MongoDB
- Refactored solved-problem fetching to persist results in database
- Prepared user data layer for dashboards and analytics

### Phase 7.3 – Matchmaking Refactor (MongoDB + Redis)

- Refactored matchmaking logic to fetch users directly from MongoDB
- Restricted Redis usage strictly to queue coordination and atomic matching
- Used socket-to-user mapping to identify participants during matchmaking
- Ensured matchmaking remains race-condition safe and horizontally scalable

### Phase 7.4 – Secure Submission Verification

- Refactored submission verification to derive user identity from socket bindings
- Removed trust in frontend-sent user identifiers
- Integrated Codeforces API for verdict and problem validation
- Ensured backend-controlled winner determination

### Phase 7.5 – Match History Persistence

- Introduced Match schema to persist completed matches
- Stored room ID, participants, problem ID, winner, and timestamps
- Persisted match results immediately after successful verification
- Enabled future features like match history and leaderboards

### Phase 7.6 – Real-Time Room & Chat Stabilization

- Fixed socket lifecycle issues causing premature disconnects
- Stabilized room join and leave logic for post-match discussions
- Ensured chat events do not interfere with submission flow
- Achieved reliable real-time communication across full match lifecycle

## Phase 8.1 – Environment Configuration & Deployment Readiness

- Removed hardcoded ports and URLs from frontend and backend
- Introduced environment variables for API base URL, ports, and secrets
- Configured `.env` usage for local development and production readiness
- Ensured sensitive configuration files are excluded via `.gitignore`
- Prepared application for cloud deployment without code changes

## Phase 8.2 – Database Integration (MongoDB)

- Integrated MongoDB as the persistent data store for users
- Defined User schema with username, password hash, and Codeforces handle
- Replaced in-memory user storage with MongoDB-backed models
- Verified database connectivity using environment-based connection strings
- Enabled persistent user accounts across server restarts

## Phase 8.3 – JWT Authentication & Secure Identity Handling

- Implemented JWT-based authentication for login and signup
- Issued signed tokens upon successful authentication
- Secured protected endpoints using JWT verification middleware
- Migrated user identity handling from frontend-controlled values to backend-derived identity
- Updated WebSocket authentication to validate users via JWT instead of query params

### Phase 8.4 – Login & Signup UI

- Implemented login and signup pages using Next.js
- Integrated JWT-based authentication with backend
- Stored authentication token in sessionStorage
- Redirected unauthenticated users to login page

### Phase 8.5 – UI & UX Completion

- Added global navigation bar with client-side routing
- Implemented logout by clearing JWT session and redirecting to login
- Created dashboard page displaying user profile data
- Protected authenticated routes using token guards
- Improved overall UI consistency and app structure


### Phase 8.6 – UI Polish

- Introduced consistent page layout and card-based UI
- Improved status visibility with visual indicators
- Polished problem, submission, result, and chat sections
- Enhanced room experience with clear structure and flow

### Phase 8.7 – Dashboard & User Statistics

- Extended user schema to track match statistics
- Persisted match outcomes on match completion
- Exposed aggregated user stats via authenticated API
- Updated dashboard to display real-time user performance data

### Phase 8.8 – Difficulty-Aware Matchmaking

- Added user-controlled problem difficulty selection
- Propagated rating range through matchmaking API
- Integrated rating filters into problem selection logic
- Improved match personalization without affecting queue fairness

### Phase 8.9 – Match Timer & History

- Added server-authoritative match timing
- Persisted match history with duration and outcome
- Implemented live in-room timer
- Displayed detailed match history on dashboard
- Enabled performance tracking across sessions

