# 🎯 FIND THE NUMBER — Real-Time Multiplayer Web Game

> **Think fast. Guess smart. Find the number.**

**Find The Number** is a production-ready, server-authoritative, real-time multiplayer party game designed for 2–4 players. One player secretly locks a number between 1 and 1000, while the other players take turns guessing under a 15-second timer. The next guesser is selected dynamically by an animated, fair **Spin Wheel**.

---

## 🚀 Key Features

* **Server-Authoritative Anti-Cheat**:
  * The secret number is stored strictly in server memory.
  * Guessers never receive or have access to the secret number until the round is completed.
  * Score calculation, winner announcement, and turn expiration are all server-driven.
* **6-Digit Numeric Room Codes**:
  * Secure numeric codes (e.g. `482731`) for private room creation and instant joining.
  * Built-in one-click code copying.
* **Fair Setter & Guesser Rotations**:
  * The Number Setter rotates deterministically between rounds so every player takes turns setting the secret.
  * The Number Setter is strictly excluded from the guesser pool and spin wheel.
  * A fair turn-cycle (shuffle-bag) ensures every eligible player gets an equal number of guessing opportunities before repeating.
* **Synchronized Animated Spin Wheel 🎡**:
  * Server selects the next player first, then broadcasts the target angle and selected ID.
  * All connected clients animate simultaneously toward the same player segment.
  * Visual pointer, segment dividers, acceleration/deceleration physics, and audio clicks.
* **15-Second Turn Timer**:
  * Server-managed countdown with visual progress bar and urgent audio ticks.
* **Dynamic Higher / Lower Feedback**:
  * Displays 🔼 HIGHER (secret is greater) or 🔽 LOWER (secret is smaller).
  * Possible range automatically shrinks (e.g., `401 – 799`) to aid tactical deductive reasoning.
* **Dynamic Scoring Formula**:
  * Round winner receives `100 − (incorrectGuesses × 5)` points (minimum 10 points).
* **5-Round Match & Rematch**:
  * Match runs for 5 rounds, culminating in a tournament podium with 🥇, 🥈, 🥉 rankings and tie/draw handling (`🤝 DRAW`).
  * One-click "Play Again" (rematch) preserves the room and players while resetting scores.
* **Full Audio Synthesizer**:
  * Zero-dependency Web Audio API synthesizer for wheel ticks, stop dings, higher/lower chimes, and victory fanfare, with a persistent mute toggle.
* **Disconnect & Reconnection Handling**:
  * Auto-reconnection via session tokens, host migration if host drops, and game pausing if players drop below 2.

---

## 🛠 Tech Stack

* **Frontend**: React 19, TypeScript, Tailwind CSS, Lucide Icons, Canvas Confetti
* **Backend**: Node.js, Express, Socket.IO
* **Build Tooling**: Vite, esbuild, tsx

---

## 📡 Socket.IO Architecture & Event Flow

```text
Client                              Server
  │                                    │
  ├─── createRoom / joinRoom ─────────►│ (Validates 6-digit code & name)
  │◄── roomStateUpdate ────────────────┤ (Broadcasts updated lobby)
  │                                    │
  ├─── startGame (Host) ──────────────►│ (Round 1 begins; setter assigned)
  │◄── roundStarted / roomStateUpdate ─┤ (Setter selection phase)
  │                                    │
  ├─── submitSecret (Setter) ─────────►│ (Validates 1..1000 & locks)
  │◄── secretLocked ───────────────────┤
  │                                    │
  │◄── wheelStarted (wheelData) ───────┤ (Server chooses player & angle)
  │    [Animated Wheel spins 3.5s]     │
  │◄── turnStarted (15s timer) ────────┤ (Guesser's turn begins)
  │                                    │
  ├─── submitGuess ───────────────────►│ (Validates range & duplicates)
  │◄── guessResult (HIGHER / LOWER) ───┤ (Updates bounds; spins wheel again)
  │    or                              │
  │◄── guessResult (CORRECT!) ─────────┤ (Calculates score & ends round)
  │◄── roomStateUpdate (round_result) ─┤
  │                                    │
  ├─── nextRound / rematch ───────────►│ (Advances match or restarts)
```

---

## 💻 Installation & Development

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Development Server
```bash
npm run dev
```
Starts the full-stack server on `http://0.0.0.0:3000` with Vite middleware.

### 3. Production Build
```bash
npm run build
```
Compiles client static assets via Vite into `dist/` and bundles `server.ts` into `dist/server.cjs` via esbuild.

### 4. Production Start
```bash
npm start
```
Runs the compiled server at `dist/server.cjs`.

---

## ⚙️ Environment Variables

Declared in `.env.example`:
* `PORT` (default `3000`): Port on which the HTTP & WebSocket server binds.

---

## 📖 Game Rules Summary

1. **Setter**: One player locks a secret number between 1 and 1000.
2. **Wheel**: The Next Guesser Spin Wheel selects a player.
3. **Timer**: The selected player has 15 seconds to enter a guess.
4. **Clues**: `HIGHER` means the secret is greater; `LOWER` means smaller.
5. **Score**: Finding the number awards base 100 points minus 5 points per incorrect guess in the round (minimum 10).
6. **Match**: 5 rounds with rotating roles. Player with the highest total score wins!
