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


