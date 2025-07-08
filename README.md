# CodeFight ⚔️

A real-time 1v1 competitive coding platform where users face off in solving coding problems under time pressure — just like a virtual code arena.

🌐 [Live Demo](https://codefight-akschanshrai04s-projects.vercel.app/home)

---

## 🚀 Features

- 🔁 **Real-time 1v1 Matches** using Socket.IO
- 🧠 **Problem Statement + Countdown Timer** on match start
- 💬 **In-built Chat System** to talk to your opponent
- ⌛ **Custom Time Limit** when creating a room
- 💻 **Monaco Code Editor** for writing and testing code
- ⚙️ **Self-hosted Docker-based Code Execution** via [Piston](https://github.com/engineer-man/piston)
- 🔒 **Firebase Auth** for user management
- 🖥️ Currently supports **C++** (more languages coming soon)

---

## 🛠 Tech Stack

- **Frontend:** Next.js, JavaScript, Monaco Editor
- **Backend:** Node.js, Express.js, Socket.IO
- **Auth & Realtime DB:** Firebase
- **Code Execution:** Dockerized [Piston Engine](https://github.com/engineer-man/piston)

---

## 📦 Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- Docker (for local code execution, optional if using external Piston instance)
- Firebase Project & Config

### Folder Structure

```
CodeFight/
├── client/ # Next.js frontend
├── server/ # Express.js backend (Socket.IO + code execution)
└── README.md
```

---

## 🔧 Installation

### 1. Clone the Repository

```
git clone https://github.com/<your-username>/CodeFight.git
cd CodeFight
```

### 2. Install & Run Client

```
cd client
npm install
npm run dev
```

This will start the frontend at http://localhost:3000

### 3. Install & Run Server

In a new terminal:

```
cd server
npm install
npm run start
```

This will start the backend server at http://localhost:5000 (or your configured port)

---

## 🗝️ Environment Variables

Set up Firebase and any required environment variables for both client and server. Create `.env.local` in the `client/` and `.env` in `server/`.

Example keys:

```
client/.env.local
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...

server/.env
PISTON_API_URL=http://localhost:2000/execute # if self-hosting
```

---

## 💡 Future Plans

- Add support for more programming languages
- Leaderboards & match history
- Spectator mode & room sharing
