# ⚔️ PairPrep

A real-time, 1v1 competitive coding platform built with Next.js, Node.js, Socket.IO, and Redis. PairPrep enables developers to match with identically skilled peers, receive a unique Codeforces problem, and race to solve it live.

## 🚀 Features

### Core Matchmaking

- **Difficulty-Based Pairing** - Select your desired difficulty (800 - 1600 rating) and instantly drop into an isolated, strictly matched queue.
- **Real-Time Rooms** - Dedicated WebSocket rooms ensure your opponent receives instant status updates.
- **Problem Avoidance** - The backend cross-references the Codeforces API to guarantee neither you nor your opponent has ever seen the assigned problem before.

### Competitive Experience

- **Live Chat** - Real-time messaging directly inside the match UI to communicate with your opponent.
- **Authoritative Server Verification** - The frontend doesn't trust the client. The backend verifies all submissions directly via the Codeforces API before declaring a winner.
- **Live Match Timer** - Synchronized tracking to record precisely how quickly the problem was solved.

### Security & UX

- **Socket-Bound Identity** - User identity is strictly derived from JWTs on the backend, not vulnerable frontend payloads, preventing spoofing.
- **Persistent User Profiles** - Comprehensive Dashboards tracking Total Matches, Win/Loss ratios, and unique Problems Solved.
- **Horizontal Scalability** - Matchmaking utilizes atomic Redis `LPUSH` and `RPOP` queues to prevent race conditions and allow multi-node scaling.

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React, Tailwind CSS, Shadcn UI, Framer Motion
- **Backend**: Node.js, Express, Axios
- **Real-Time Engine**: Socket.IO
- **Database**: MongoDB Atlas (Mongoose)
- **Queue/Coordination**: Redis
- **External API**: Codeforces

## 📦 Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/PairPrep.git
cd PairPrep
```

2. Start a local Redis instance (Required for matchmaking queues):
- Make sure Redis server is running on `localhost:6379`.

3. Setup the Backend:

```bash
cd backend
npm install
```

Create a `.env` file in the `backend/src` directory:
```env
PORT=4000
MONGO_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_super_secret_jwt_key
REDIS_URL=redis://localhost:6379
```

4. Setup the Frontend:

```bash
cd ../frontend
npm install
```

Create a `.env.local` file in the `frontend` directory:
```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

5. Run the development servers concurrently:

Terminal 1 (Backend):
```bash
cd backend/src
node index.js
```

Terminal 2 (Frontend):
```bash
cd frontend
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🎯 Getting Started

### 1. Create an Account

- Register with your unique username and your valid **Codeforces Handle**.
- *Note: Your Codeforces handle must be accurate, as the backend pulls your live submission history during matches.*

### 2. Dashboard

- View your current statistics and Match History.
- Select your target difficulty rating from the dropdown menu.

### 3. Finding a Match

1. Click **Find Match**.
2. The server will atomically place you in a Redis queue matching your selected difficulty.
3. Once an opponent selects the same difficulty, the server forms a room and broadcasts the `match_found` event.

### 4. Competing

1. Click the provided Codeforces link and solve the problem.
2. Submit your code natively on the Codeforces website.
3. Return to PairPrep, enter your specific Codeforces Submission ID into the input field, and click **Verify**.
4. The backend will fetch your submission, confirm it received an `OK` verdict, and declare you the winner!

## 🔧 Core Architectural Flow

### Express REST API vs. WebSockets

- **REST** handles authoritative mutative actions: Authentic Login (`/auth/login`), Starting a Search (`/match/start`), and verifying Submissions (`/submission/submit`).
- **WebSockets** exclusively handle reactive broadcasting: Chatting (`chat_message`), rendering matches (`match_found`), and declaring winners (`match_finished`).

## 📁 Project Structure

```
pairprep/
├── backend/
│   ├── src/
│   │   ├── controllers/    # API endpoints (match, submission)
│   │   ├── models/         # MongoDB Mongoose schemas (User, Match)
│   │   ├── routes/         # Express router definitions
│   │   ├── store/          # RAM-based Socket cache mappings
│   │   ├── utils/          # Codeforces scraping and JWT creation
│   │   └── index.js        # Entry point for Express + Socket.IO
├── frontend/
│   ├── src/
│   │   ├── components/     # Reusable React UI (Navbar, Chat, etc.)
│   │   ├── pages/          # Next.js file-based routing
│   │   └── styles/         # Global Tailwind CSS
│   └── package.json
└── docs/                   # Developer logs and architecture diagrams
```

## 🧪 Testing

1. Use two different Incognito tabs (to isolate `sessionStorage`).
2. Log into Account A and Account B.
3. Select `1200` on Account A and select `800` on Account B. Verify they do NOT match.
4. Select `800` on both accounts to trigger the synchronized `match_found` WebSocket event.
5. In Account A, submit a successful Codeforces Submission ID. Verify the UI updates to "Winner" and the Dashboard increments precisely 1 Solved Problem.

## 📝 Key Implementation Details

### Socket-Bound Identity
- Users authenticate via JWT during Login. The backend maps their Username strictly to their active `Socket.ID` in memory. This physically prevents users from passing fake User IDs into WebSockets to cheat or spoof messages.

### Eventual Consistency & Winner Declaration
- When a user claims they won, the UI displays "Verifying...". A MongoDB object is ONLY constructed after the Codeforces explicit API response confirms `OK`. The "Winner" modal is securely triggered strictly via the backend broadcasting `match_finished`.

## 🌟 Future Improvements

- **WebRTC Integration**: Adding live audio channels for matched opponents.
- **Elo Rating Algorithm**: Expanding the flat Win/Loss counter to a Glicko-2 Elo system for competitive leaderboards.
- **Serverless Analytics**: Shifting the Dashboard rendering to Next.js 14 App Router SSR for extreme speed improvements.
- **Kubernetes Scaling**: Dockerizing the Node.js backend to allow dynamic pod scaling depending on active Socket.IO connections.

---

## 🔗 Links

- [Next.js Documentation](https://nextjs.org/docs)
- [Socket.IO Documentation](https://socket.io/docs/v4/)
- [Redis Commands](https://redis.io/commands/)
- [Codeforces API](https://codeforces.com/apiHelp)
