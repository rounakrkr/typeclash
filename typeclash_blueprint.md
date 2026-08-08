# TypeClash — Complete Product Blueprint

> **Real-time 1v1 Multiplayer Typing Battle Arena**
> *Chess.com for typing speed.*

---

## 1. Origin — Why This Idea?

### The Backstory — How I Got Here

I'm Rounak Kumar — 3rd year CSE at KIIT University, Bhubaneswar. CGPA 9.0. On paper, my resume looks solid. I've built an algorithmic trading system from scratch (AlcoSoft Financial Services — multi-strategy engine, async WebSocket architecture, backtested at 250% gross profit, deployed on Oracle Cloud). I've built an IoT safety monitoring system for the Ministry of Coal (MineGuard — real sensors, real collieries, real lives). I've built an AI voice assistant with wake-word detection, Whisper ASR, LLM reasoning, emotion-aware responses, and ESP32 hardware control. I've built multi-agent AI debate systems, face recognition attendance systems, resume parsers, and a daily tech learning app (Flux) with Tinder-like swipe cards.

So the skills are there. The projects are there. The problem? **I had no direction.**

I'm in the AI/ML space. I know how to use AI tools better than most — and I know that AI can write most code now (something a lot of people still don't realize). But that's exactly what made it harder: when you CAN build almost anything, the question "what SHOULD I build?" becomes paralyzing.

I watched juniors — people who look up to me — team up and start building things together. Their ideas might fail, but at least they were TRYING. Meanwhile, I was stuck in analysis paralysis. Not because I couldn't execute, but because nothing felt RIGHT enough to start.

My close friends — my roommates, my circle — they're amazing people. Like family. But they're not technical. I chose them for peace, not for building. So there was no one to push me, no co-founder to brainstorm with, no team to hold me accountable. Just me, my skills, and a blank screen.

### What I Tried (and Why It Failed)

I explored a LOT of ideas before landing on TypeClash. Each one taught me something about what I was actually looking for.

**AI Study Bot / AI Companion:** The obvious first thought — build an AI wrapper. But why would anyone use MY bot when ChatGPT exists? No differentiation. And every API call costs money — the Gemini free tier fails after 2-3 continuous calls per minute. Even my own Flux app struggles with this. Dead end.

**AI Mock Interviewer (Voice-based):** Technically exciting — I could combine my voice AI experience (Whisper + TTS from my Aino project) with my multi-agent architecture. But production-grade Voice Activity Detection (VAD) is genuinely hard to build solo. I tried with my SARA project (AI companion) — put in massive effort, still couldn't get the quality I wanted. And again, API rate limits would destroy the experience in an actual interview simulation. Dead end.

**Indian Stock Market AI Analyzer:** I have deep domain knowledge here from AlcoSoft. But SEBI regulations require RIA registration to offer financial tools to others. Even AlcoSoft — my own trading system — I can't let others use it without risking legal trouble. And the differentiation problem again: "Why not just ask ChatGPT about stocks?" Dead end.

**ATS Resume Checker:** I literally already built a resume parser (PyMuPDF, spatial text sorting, multi-column handling). This seemed like a natural extension. But... every 10th person is building ATS checkers. And modern multimodal AI can analyze PDFs now. Not novel enough. Dead end.

**DSA Algorithm Visualizer:** No AI dependency — great. But without AI generating content, I'd be manually animating algorithms one by one. Tedious, not scalable, not "tagda" enough. Dead end.

**Video-to-Notes Tool (BriefTube):** Actually a great idea — upload any video/lecture, get transcripts + summaries in Indian languages. Technically complex (my kind of challenge). But my Oracle Cloud instances have 2 cores and 1GB RAM. Whisper can't run on that. I'd be back to depending on external APIs. Dead end (for now — parking this for when I have better infra).

### The Pattern I Discovered

After all these rejections, a pattern emerged. Every idea failed for one of these reasons:

1. **AI API dependency** → Rate limits, cost, API key friction for users
2. **"Why not ChatGPT?"** → No differentiation from general-purpose AI
3. **Too common** → Already saturated, nothing novel
4. **Infrastructure mismatch** → Needed more compute than I have

The breakthrough realization: **My real strength isn't AI — it's systems engineering.** AlcoSoft's core isn't AI — it's a real-time trading engine with WebSocket architecture and concurrent state management. MineGuard's core isn't AI — it's an IoT pipeline with real-time dashboards. The AI was always an add-on, never the core.

So the right idea for me would be:
- **Zero AI dependency** (no API costs, no rate limits, no "why not ChatGPT")
- **Complex backend engineering** (what I genuinely enjoy — real-time systems, algorithms, state machines, data pipelines)
- **General public audience** (not just developers — anyone should be able to use it)
- **Built-in viral mechanics** (no marketing needed — the product spreads itself)
- **Novel enough** that people say "nobody's done this properly"

TypeClash checks every single box.

### The Problem Space

There are 50M+ monthly visits to typing practice tools (MonkeyType alone). People clearly want to improve their typing speed and track their WPM. But here's what's broken:

**Every single popular typing tool is a SOLO experience.**

- MonkeyType — Type alone. See your WPM. That's it.
- Keybr — Practice alone. Adaptive difficulty. Still alone.
- TypeRacer — Has "races" but with random strangers in lobbies, no matchmaking, no skill-based pairing, no ranking system, and a UI that looks like it was built in 2008.
- 10FastFingers — Solo tests. Leaderboards exist but you never actually COMPETE against someone in real-time.

Nobody has built the **competitive multiplayer** experience for typing. The kind where:
- You click "Find Match"
- In 3 seconds you're paired with someone your skill level
- Same text appears for both
- You race in REAL-TIME, seeing each other's progress live
- Winner gains ELO points, loser drops
- You climb a global ranking
- You get that dopamine rush of BEATING someone

**This is the Chess.com / Lichess gap — but for typing.**

Chess existed for 1500 years. Chess.com made it a global competitive online sport. Typing has existed since typewriters — but nobody has made it a proper competitive online experience.

### Why Now?

1. **Remote work exploded** — typing speed matters more than ever
2. **Mechanical keyboard community** is MASSIVE (r/MechanicalKeyboards: 2M+ members). These people are OBSESSED with WPM
3. **Competitive gaming culture** in India is at peak — people compete in everything (BGMI, Valorant, etc.). A lightweight browser-based competition fills the casual competitive gap
4. **WebSocket technology** is mature — real-time multiplayer in browser is seamless now
5. **No good solution exists** — the market leader (TypeRacer) hasn't innovated in 15 years

### Why Rounak Can Build This

- Built AlcoSoft Financial Services — async WebSocket architecture, real-time data streaming, concurrent state management. **Exactly the same skillset.**
- Built Flux — beautiful UI/UX, animations, PWA. **Frontend quality proven.**
- Has Oracle Cloud instances — **infrastructure ready**
- No AI dependency — pure engineering. **No API cost, no rate limits, no "why not ChatGPT" problem.**

---

## 2. Product Vision

### One-Liner
> **TypeClash is a real-time multiplayer typing battle platform where you race against real opponents, climb rankings, and prove you're the fastest typist.**

### Core Experience (User's Perspective)

```
1. Open typeclash.com
2. Click "Quick Match"
3. Matched with opponent in ~3 seconds
4. 3... 2... 1... GO!
5. Same paragraph appears for both players
6. Type as fast and accurately as possible
7. See opponent's live progress bar racing against yours
8. Match ends — see detailed stats comparison
9. ELO updates — you climbed 15 points!
10. "Play Again" or check leaderboard
```

**Total time from opening website to playing: under 10 seconds.** No sign-up required for casual play.

### Design Philosophy

1. **Zero friction** — Play without creating an account. Sign up only to save stats.
2. **Instant gratification** — Matches are 30-60 seconds. Perfect for breaks.
3. **Competitive depth** — ELO rating, seasons, leaderboards for those who want to go deep.
4. **Social by design** — Challenge friends, college leaderboards, shareable results.
5. **Beautiful and fast** — Premium feel. Smooth animations. Dark mode. No ads (initially).

---

## 3. Market Analysis

### Target Audience (Layered)

| Layer | Who | Size | How They Find TypeClash |
|---|---|---|---|
| **Core** | Mechanical keyboard enthusiasts, typing speed nerds | ~5M globally | Reddit, Discord, YouTube keyboard channels |
| **Primary** | College students (India + global) | ~50M in India alone | WhatsApp groups, college communities, word of mouth |
| **Secondary** | Remote workers wanting to improve typing | ~100M+ globally | Google search "typing speed test", Product Hunt |
| **Tertiary** | Anyone who types and is slightly competitive | Billions | Viral sharing, social media |

### Competitive Landscape

| Competitor | Monthly Visits | Strength | Weakness | TypeClash Advantage |
|---|---|---|---|---|
| MonkeyType | 50M+ | Beautiful UI, customizable | Solo only. No competition. | Real-time multiplayer |
| TypeRacer | 5M+ | Has multiplayer races | Ancient UI. No matchmaking. No ELO. Random lobbies. | Proper matchmaking + modern UX |
| Keybr | 3M+ | Smart adaptive training | Solo only. No social. | Social + competitive layer |
| 10FastFingers | 4M+ | Simple, fast test | Solo. Basic leaderboard. | Real-time head-to-head |
| Nitro Type | 8M+ | Gamified (cars) | Targeted at kids. Cartoonish. | Premium, mature aesthetic |

**Key insight:** MonkeyType proves there's MASSIVE demand (50M visits/month). TypeClash doesn't need to beat MonkeyType — it needs to capture the segment that wants COMPETITION, not just practice.

### Market Size Estimation

- 50M people visit typing tools monthly
- Even 0.5% conversion to TypeClash = **250,000 monthly users**
- Average competitive game player spends 15-30 min per session
- Multiple sessions per week for engaged users

---

## 4. Core Features — Detailed

### 4.1 Game Modes

#### Quick Match (1v1 Ranked)
- Click "Find Match" → matched by ELO within 3-5 seconds
- Both players get identical text (paragraph, quote, or passage)
- Real-time progress tracking (opponent's WPM visible as a progress bar)
- Match duration: 30-90 seconds depending on text length
- Post-match: detailed stats comparison (WPM, accuracy, consistency, error map)
- ELO adjustment calculated and displayed

#### Practice Mode (Solo)
- MonkeyType-style solo practice
- Multiple durations: 15s, 30s, 60s, 120s
- Word mode or paragraph mode
- Stats tracking (WPM, accuracy, consistency over time)
- Personal best tracking
- **This mode ensures the product is useful even with 0 other users online**

#### Challenge Link (Async Multiplayer)
- Type a passage → get a shareable link
- Send to friend → they type the SAME passage
- Comparison appears side by side
- **Critical for cold start** — works even when both players aren't online simultaneously
- **Viral mechanic** — "Beat my score: [link]" shared on WhatsApp/Instagram stories

#### Private Room (Friends)
- Create room → share code/link
- 2-8 players join
- Host selects text or game mode
- Race together
- **This is how college groups will use it**

#### Tournament Mode (Future)
- Bracket-based elimination (8, 16, 32 players)
- Swiss system for larger tournaments
- Scheduled tournaments (daily/weekly)
- College-specific tournaments
- Prize support (future monetization angle)

### 4.2 Text Content

Text passages should be varied and interesting:

| Category | Examples | Audience |
|---|---|---|
| **Literature** | Classic novel excerpts, poetry | General |
| **Tech** | Programming concepts, tech articles | Developers |
| **Code Snippets** | Actual code in Python, JS, etc. (with special characters) | Programmers |
| **Quotes** | Famous quotes, motivational text | General |
| **Random Words** | Pure random words (like MonkeyType) | Speed focus |
| **Custom** | User-submitted or room-specific text | Private rooms |
| **Hindi/Regional** | Passages in Hindi, other Indian languages | Indian audience |

### 4.3 Ranking System

**ELO Rating System (inspired by Chess.com):**

- New players start at 1000 ELO
- Win against higher-rated player = more points gained
- Lose against lower-rated player = more points lost
- K-factor adjusts based on number of matches played (new players' ratings change faster)

**Rank Tiers:**

| Rank | ELO Range | Badge |
|---|---|---|
| Bronze | 0 - 999 | 🥉 |
| Silver | 1000 - 1199 | 🥈 |
| Gold | 1200 - 1399 | 🥇 |
| Platinum | 1400 - 1599 | 💎 |
| Diamond | 1600 - 1799 | 💠 |
| Master | 1800 - 1999 | 👑 |
| Grandmaster | 2000+ | ⚡ |

**Leaderboards:**
- Global leaderboard
- Country leaderboard (India, US, etc.)
- **College leaderboard** (KIIT, VIT, SRM, BITS, IITs — users register with college name)
- Weekly leaderboard (resets every Monday — gives new players a chance)
- Friends leaderboard

### 4.4 Anti-Cheat System

This is CRITICAL for competitive integrity. People will try to cheat.

**Detection methods:**

1. **Keystroke timing analysis**
   - Real humans have variable inter-key delays (50-200ms)
   - Bots/auto-typers have unnaturally consistent timing
   - Flag accounts with suspiciously uniform keystroke intervals

2. **Copy-paste detection**
   - Detect if text is pasted rather than typed
   - Monitor clipboard events
   - Instant disqualification if detected

3. **WPM anomaly detection**
   - Track historical WPM per user
   - Flag sudden jumps (e.g., 60 WPM average suddenly typing 150 WPM)
   - Require "verification match" for suspicious improvements

4. **Browser extension detection**
   - Detect known auto-typing extensions
   - Monitor for programmatic keyboard events vs real keyboard events

5. **Statistical analysis**
   - Real typing has characteristic error patterns (adjacent key errors, repeated corrections)
   - Bot typing has no natural errors or unnaturally distributed errors

### 4.5 User Profiles & Stats

**Profile contains:**
- Username, avatar, rank badge
- Total matches played / won / lost
- Win rate percentage
- Average WPM, best WPM, accuracy
- WPM trend graph (improvement over time)
- Match history (last 50 matches with opponent, result, WPM)
- Achievement badges
- College affiliation (optional)
- "Member since" date

**Achievements (examples):**
- 🏁 First Blood — Win your first match
- 🔥 On Fire — Win 5 matches in a row
- 💯 Perfectionist — Complete a match with 100% accuracy
- ⚡ Speed Demon — Achieve 100+ WPM in a ranked match
- 🏆 Top 100 — Reach global top 100
- 🎓 College Champion — #1 in your college leaderboard
- 📅 Daily Grinder — Play at least 1 match every day for 30 days

### 4.6 Social & Viral Features

1. **Challenge Link** — "Beat my score" shareable URL
2. **Match Result Card** — Auto-generated image showing match result, shareable on social media
3. **College Leaderboard** — Inter-college competition drives organic growth
4. **"Rematch" button** — Keep the rivalry going
5. **Spectator mode** — Watch ongoing matches (especially top-ranked players)
6. **Weekly digest** — "Your week: 47 matches, WPM improved by 8%, ranked up to Gold"

---

## 5. Technical Architecture

### 5.1 System Overview

```
                        ┌─────────────────────────────────────────┐
                        │              FRONTEND                    │
                        │         (Static Site / PWA)              │
                        │                                          │
                        │  ┌──────────┐  ┌──────────┐  ┌───────┐ │
                        │  │  Game UI  │  │  Lobby   │  │ Stats │ │
                        │  │ (Canvas/  │  │  Match   │  │ Pages │ │
                        │  │  DOM)     │  │  Queue   │  │       │ │
                        │  └────┬─────┘  └────┬─────┘  └───┬───┘ │
                        │       │              │            │      │
                        └───────┼──────────────┼────────────┼──────┘
                                │              │            │
                         WebSocket         WebSocket     REST API
                                │              │            │
                        ┌───────┼──────────────┼────────────┼──────┐
                        │       ▼              ▼            ▼      │
                        │  ┌─────────────────────────────────────┐ │
                        │  │          APPLICATION SERVER          │ │
                        │  │       (Node.js / Python FastAPI)     │ │
                        │  │                                      │ │
                        │  │  ┌──────────────┐ ┌───────────────┐ │ │
                        │  │  │ WebSocket    │ │  REST API     │ │ │
                        │  │  │ Manager      │ │  Server       │ │ │
                        │  │  │              │ │               │ │ │
                        │  │  │ • Connection │ │ • Auth        │ │ │
                        │  │  │   Pool       │ │ • Profiles    │ │ │
                        │  │  │ • Room Mgmt  │ │ • Leaderboard │ │ │
                        │  │  │ • Game State │ │ • Stats       │ │ │
                        │  │  │   Sync       │ │ • Match Hist  │ │ │
                        │  │  └──────┬───────┘ └───────┬───────┘ │ │
                        │  │         │                  │         │ │
                        │  │  ┌──────▼──────────────────▼───────┐ │ │
                        │  │  │        GAME ENGINE               │ │ │
                        │  │  │                                  │ │ │
                        │  │  │  • Matchmaking Queue             │ │ │
                        │  │  │  • ELO Calculator                │ │ │
                        │  │  │  • Anti-Cheat Validator          │ │ │
                        │  │  │  • Text Provider                 │ │ │
                        │  │  │  • Match State Machine           │ │ │
                        │  │  └──────────────┬───────────────────┘ │ │
                        │  └─────────────────┼─────────────────────┘ │
                        │                    │                       │
                        │  ┌─────────────────▼─────────────────────┐ │
                        │  │            DATABASE                    │ │
                        │  │    (PostgreSQL / SQLite for MVP)       │ │
                        │  │                                        │ │
                        │  │  Tables:                               │ │
                        │  │  • users (id, username, elo, stats)    │ │
                        │  │  • matches (id, p1, p2, result, wpm)  │ │
                        │  │  • keystrokes (match_id, timestamps)  │ │
                        │  │  • leaderboard_cache                  │ │
                        │  │  • achievements                       │ │
                        │  │  • colleges                            │ │
                        │  └────────────────────────────────────────┘ │
                        │                                             │
                        │              ORACLE CLOUD                   │
                        └─────────────────────────────────────────────┘
```

### 5.2 Tech Stack

| Layer | Technology | Reasoning |
|---|---|---|
| **Frontend** | Vanilla HTML/CSS/JS (or lightweight framework like Preact) | Fast loading. No heavy framework overhead. PWA for installability. |
| **Styling** | Custom CSS with design tokens | Premium dark theme. Smooth animations. Same approach as Flux. |
| **Real-time** | WebSocket (native or Socket.io) | Bi-directional real-time communication. Essential for live gameplay. |
| **Backend** | Python FastAPI OR Node.js | FastAPI: Rounak already knows it, async support. Node: natural WebSocket fit. |
| **Database** | SQLite (MVP) → PostgreSQL (scale) | SQLite is zero-config for MVP. Migrate to Postgres when needed. |
| **Auth** | JWT tokens (optional, guest play supported) | Lightweight. No OAuth dependency initially. |
| **Deployment** | Oracle Cloud (2 instances available) | Instance 1: App server. Instance 2: Database + static files. Or both on one. |
| **CDN / Static** | Cloudflare (free tier) | Cache static assets. DDoS protection. Free SSL. |
| **Domain** | typeclash.com / typeclash.io | ~$10-15/year |

### 5.3 Core Backend Systems

#### Matchmaking System

```
Player joins queue
    │
    ▼
┌─────────────────────────┐
│   MATCHMAKING QUEUE      │
│                          │
│   Sorted by ELO rating   │
│   Each entry:            │
│   {userId, elo, joinedAt}│
└──────────┬───────────────┘
           │
           ▼
    ┌──────────────┐
    │  Match Finder │ (runs every 500ms)
    │              │
    │  Algorithm:  │
    │  1. Sort queue by ELO            │
    │  2. For each player, find closest│
    │     ELO within ±100 range        │
    │  3. If waiting > 10s, expand     │
    │     range to ±200                │
    │  4. If waiting > 30s, expand     │
    │     to ±500                      │
    │  5. If waiting > 60s, match with │
    │     ANY available player         │
    │  6. If no match after 90s,       │
    │     offer bot match              │
    └──────────┬───────────────┘
               │
               ▼
    ┌─────────────────┐
    │  Create Game Room│
    │  Assign text     │
    │  Notify both     │
    │  players via WS  │
    │  Start countdown │
    └─────────────────┘
```

#### Game State Machine

```
States:
    WAITING → COUNTDOWN → PLAYING → FINISHED → STATS

WAITING:
    - Both players connected
    - Text loaded
    - Transition: Both ready → COUNTDOWN

COUNTDOWN:
    - 3... 2... 1... GO!
    - Duration: 3 seconds
    - Transition: Timer ends → PLAYING

PLAYING:
    - Both players typing
    - Real-time keystroke events sent via WebSocket
    - Server validates each keystroke
    - Server broadcasts progress to both players
    - Transition: Either player finishes OR timeout (120s)

FINISHED:
    - Calculate final WPM, accuracy for both
    - Determine winner
    - Calculate ELO change
    - Transition: Auto → STATS

STATS:
    - Display detailed comparison
    - Save match to database
    - Update leaderboards
    - Show "Rematch" / "New Match" options
```

#### WebSocket Message Protocol

**Client → Server:**
```json
{"type": "join_queue", "mode": "ranked"}
{"type": "keystroke", "char": "h", "pos": 0, "ts": 1691234567890}
{"type": "finished", "wpm": 85, "accuracy": 97.2}
{"type": "create_room", "settings": {"maxPlayers": 4, "textMode": "quotes"}}
{"type": "join_room", "roomCode": "ABC123"}
{"type": "challenge", "opponentId": "user_xyz"}
```

**Server → Client:**
```json
{"type": "match_found", "opponent": {"name": "SpeedDemon", "elo": 1340}, "text": "The quick brown..."}
{"type": "countdown", "value": 3}
{"type": "opponent_progress", "pos": 45, "wpm": 78, "errors": 2}
{"type": "match_result", "winner": "you", "yourWpm": 85, "oppWpm": 78, "eloChange": +15}
{"type": "error", "message": "Opponent disconnected. Match cancelled."}
```

#### ELO Calculation

```
Standard ELO formula:

Expected Score:
    EA = 1 / (1 + 10^((RB - RA) / 400))

New Rating:
    RA_new = RA + K × (SA - EA)

Where:
    RA = Player A's current rating
    RB = Player B's current rating
    SA = Actual score (1 = win, 0.5 = draw, 0 = loss)
    EA = Expected score
    K  = K-factor:
         K = 40 for players with < 30 matches (volatile, learn fast)
         K = 20 for players with 30-100 matches
         K = 10 for players with 100+ matches (stable)

Example:
    Player A: 1200 ELO
    Player B: 1350 ELO
    Player A wins (upset!)
    
    EA = 1 / (1 + 10^((1350 - 1200) / 400)) = 0.297
    RA_new = 1200 + 40 × (1 - 0.297) = 1200 + 28 = 1228 (+28!)
    RB_new = 1350 + 20 × (0 - 0.703) = 1350 - 14 = 1336 (-14)
```

### 5.4 Database Schema (Core Tables)

```sql
-- Users table
CREATE TABLE users (
    id              TEXT PRIMARY KEY,       -- UUID
    username        TEXT UNIQUE NOT NULL,
    email           TEXT UNIQUE,            -- Optional (guest users won't have)
    password_hash   TEXT,                   -- Optional (guest = no password)
    display_name    TEXT,
    avatar_url      TEXT,
    college         TEXT,                   -- Optional college affiliation
    country         TEXT DEFAULT 'IN',
    elo_rating      INTEGER DEFAULT 1000,
    peak_elo        INTEGER DEFAULT 1000,
    rank_tier       TEXT DEFAULT 'Bronze',
    
    -- Aggregate stats (updated after each match)
    matches_played  INTEGER DEFAULT 0,
    matches_won     INTEGER DEFAULT 0,
    avg_wpm         REAL DEFAULT 0,
    best_wpm        REAL DEFAULT 0,
    avg_accuracy    REAL DEFAULT 0,
    current_streak  INTEGER DEFAULT 0,     -- Win streak
    best_streak     INTEGER DEFAULT 0,
    
    created_at      TIMESTAMP DEFAULT NOW(),
    last_active     TIMESTAMP DEFAULT NOW(),
    is_guest        BOOLEAN DEFAULT TRUE
);

-- Matches table (every completed match)
CREATE TABLE matches (
    id              TEXT PRIMARY KEY,
    player1_id      TEXT REFERENCES users(id),
    player2_id      TEXT REFERENCES users(id),
    winner_id       TEXT REFERENCES users(id),   -- NULL if draw
    text_content    TEXT NOT NULL,                -- The text that was typed
    text_category   TEXT,                         -- 'quotes', 'code', 'literature'
    game_mode       TEXT DEFAULT 'ranked',        -- 'ranked', 'casual', 'private'
    
    -- Player 1 stats
    p1_wpm          REAL,
    p1_accuracy     REAL,
    p1_elo_before   INTEGER,
    p1_elo_after    INTEGER,
    p1_time_ms      INTEGER,                     -- Time to complete in ms
    
    -- Player 2 stats
    p2_wpm          REAL,
    p2_accuracy     REAL,
    p2_elo_before   INTEGER,
    p2_elo_after    INTEGER,
    p2_time_ms      INTEGER,
    
    started_at      TIMESTAMP,
    finished_at     TIMESTAMP,
    duration_ms     INTEGER
);

-- Keystroke data (for anti-cheat analysis and replay)
CREATE TABLE keystrokes (
    match_id        TEXT REFERENCES matches(id),
    user_id         TEXT REFERENCES users(id),
    char_typed      TEXT,
    position        INTEGER,
    timestamp_ms    BIGINT,                      -- Unix timestamp in ms
    is_correct      BOOLEAN,
    PRIMARY KEY (match_id, user_id, position)
);

-- Leaderboard cache (rebuilt periodically)
CREATE TABLE leaderboard (
    user_id         TEXT REFERENCES users(id),
    scope           TEXT,                        -- 'global', 'india', 'kiit', etc.
    rank            INTEGER,
    elo_rating      INTEGER,
    matches_played  INTEGER,
    win_rate        REAL,
    avg_wpm         REAL,
    updated_at      TIMESTAMP
);

-- Achievements
CREATE TABLE user_achievements (
    user_id         TEXT REFERENCES users(id),
    achievement_id  TEXT,                        -- 'first_blood', 'speed_demon', etc.
    unlocked_at     TIMESTAMP,
    PRIMARY KEY (user_id, achievement_id)
);

-- Challenge links (async multiplayer)
CREATE TABLE challenges (
    id              TEXT PRIMARY KEY,
    creator_id      TEXT REFERENCES users(id),
    text_content    TEXT,
    creator_wpm     REAL,
    creator_accuracy REAL,
    created_at      TIMESTAMP,
    expires_at      TIMESTAMP                   -- Auto-expire after 7 days
);
```

### 5.5 Infrastructure (Oracle Cloud)

**Instance 1 (Primary — App Server):**
- OS: Ubuntu
- Runs: FastAPI/Node app + WebSocket server
- RAM: 1GB (sufficient — WebSocket connections are lightweight, ~2KB per connection)
- Can handle ~500 concurrent WebSocket connections comfortably
- Estimated: 200-300 concurrent users before needing to scale

**Instance 2 (Database + Static):**
- Runs: PostgreSQL (or SQLite initially)
- Serves static frontend files via Nginx
- Or: Use Cloudflare Pages (free) for static frontend, use this instance only for DB

**Scaling path (when needed):**
- Oracle Cloud free tier includes 2 AMD instances + 4 ARM instances
- ARM instances: 4 OCPUs, 24GB RAM total (!) — this is generous
- Can scale significantly within free tier before needing to pay

### 5.6 Performance Considerations

- **WebSocket message size:** ~50-100 bytes per keystroke event. At 100 WPM (average), that's ~8 keystrokes/second = ~800 bytes/second per player. Minimal bandwidth.
- **Latency:** Target < 100ms for opponent progress updates. WebSocket over TCP handles this easily.
- **Database writes:** Match results written after game ends (not during). Keystroke data can be batch-inserted after match. No write bottleneck during gameplay.
- **Matchmaking:** Queue scan runs every 500ms. With < 1000 users in queue, this is instant.

---

## 6. User Acquisition Strategy — No Marketing Required

### Phase 1: Build the Magnet (Week 1-2)

Before multiplayer, build a **killer solo typing test** with:
- Beautiful dark UI (Flux-quality)
- Multiple modes (15s, 30s, 60s, words, paragraphs)
- Detailed stats (WPM, accuracy, consistency graph)
- Shareable result card (auto-generated image with your WPM and accuracy)

**Why solo first?** Because even without other users, the site is useful. People come for the typing test, stay for the multiplayer.

### Phase 2: Seed with College (Week 3-4)

1. Post in KIIT WhatsApp/Telegram groups:
   > *"Bhai ek typing speed test banaya hai — apna WPM check karo: typeclash.com. Friends ko challenge bhi kar sakte ho."*

2. That's it. College students are competitive. They WILL share their scores. They WILL challenge friends.

3. Target: **50-100 active users from KIIT alone.**

### Phase 3: College vs College (Month 2)

- Enable **College Leaderboard**
- Post in other college groups (VIT, SRM, BITS Discord servers)
- Frame it as: *"KIIT is currently #1 on TypeClash. Can your college beat them?"*
- Inter-college pride is an INSANELY powerful growth driver in India
- This is how Wordle went viral — competition + social sharing

### Phase 4: Community Seeding (Month 2-3)

- **Reddit:**
  - r/MechanicalKeyboards (2M members) — "I built a real-time 1v1 typing battle platform"
  - r/typing — direct audience
  - r/developersIndia (1.1M members) — "Made by an Indian engineering student"
  - r/webdev — technical showcase
  
- **Product Hunt:**
  - Launch as "Chess.com for Typing"
  - Great fit for PH audience (tech-savvy, love productivity tools)

- **Hacker News:**
  - "Show HN: TypeClash — Real-time 1v1 Typing Battles with ELO"
  - HN loves technically interesting projects

- **YouTube:**
  - Mechanical keyboard YouTubers (Hipyo Tech, TaeKeyboards) — they'd love featuring a typing battle platform
  - Tech YouTubers reviewing cool projects

### Phase 5: Organic Growth (Month 3+)

By this point, if the product is good:
- Google SEO: "typing speed test" has 5M+ monthly searches
- Word of mouth from existing users
- Challenge links shared on social media
- College leaderboard competition self-perpetuating
- Keyboard community adoption

**No paid marketing needed at any stage.**

---

## 7. Monetization (Future — Not Priority for MVP)

### Free Tier (Forever Free)
- Unlimited ranked matches
- Solo practice
- Basic stats
- Challenge links
- All game modes

### Premium ($3-5/month or ₹149-249/month)
- **Custom themes** (neon, retro, minimal, etc.)
- **Custom avatars** / profile frames
- **Detailed analytics** (per-finger speed, error heatmap, improvement graph)
- **Ad-free** (if ads are ever added)
- **Priority matchmaking** (shorter queue times)
- **Match replay** (watch your old matches keystroke by keystroke)
- **Custom text upload** (practice with your own text)

### Alternative Revenue
- **Sponsored tournaments** (brands sponsor prize pools)
- **College/company licenses** (bulk premium for organizations)
- **API access** (embed TypeClash widget on other sites)

### Revenue Estimation (Conservative)
- 10,000 MAU (month 6 realistic target)
- 2% conversion to premium = 200 paying users
- ₹199/month average = ₹39,800/month (~$475/month)
- Not life-changing, but proves the model works

---

## 8. Risk Analysis

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| No users show up initially | Medium | High | Solo mode + challenge links work without live opponents |
| Cheating ruins competitive integrity | High | High | Multi-layer anti-cheat system (keystroke analysis, anomaly detection) |
| Server can't handle load | Low (initially) | Medium | Oracle Cloud free tier is generous. Scale to ARM instances if needed. |
| TypeRacer copies features | Low | Medium | Execution speed matters. They haven't innovated in 15 years. |
| MonkeyType adds multiplayer | Medium | High | First-mover advantage. Community building. Focus on competitive (ELO, tournaments). |
| Users churn after novelty wears off | Medium | Medium | Seasonal resets, tournaments, achievements, college leaderboards keep engagement |
| Legal/IP issues | Very Low | Low | Original code. No scraping. Standard typing test concept (not patentable). |

---

## 9. Development Roadmap

### Phase 1: Foundation (Week 1-2)
- [ ] Project setup (frontend + backend)
- [ ] Core typing engine (text display, keystroke capture, WPM/accuracy calculation)
- [ ] Solo practice mode (15s, 30s, 60s)
- [ ] Beautiful dark UI with smooth animations
- [ ] Basic user system (guest + optional signup)
- [ ] Deploy to Oracle Cloud

**Deliverable:** A beautiful solo typing test that works. Shareable. Usable.

### Phase 2: Multiplayer Core (Week 3-4)
- [ ] WebSocket server setup
- [ ] Matchmaking queue
- [ ] Game room management
- [ ] Real-time opponent progress sync
- [ ] Match result calculation
- [ ] Post-match stats screen
- [ ] ELO rating system

**Deliverable:** Working 1v1 real-time typing battle.

### Phase 3: Social & Competitive (Week 5-6)
- [ ] Challenge links (async multiplayer)
- [ ] Private rooms (friends)
- [ ] Global leaderboard
- [ ] College leaderboard
- [ ] User profiles with stats
- [ ] Match history
- [ ] Shareable result cards

**Deliverable:** Full social competitive experience. Ready for launch.

### Phase 4: Polish & Growth (Week 7-8)
- [ ] Anti-cheat system
- [ ] Multiple text categories (code, quotes, literature)
- [ ] Achievement system
- [ ] PWA support (installable)
- [ ] SEO optimization
- [ ] Performance optimization
- [ ] Reddit/PH launch prep

**Deliverable:** Production-ready, polished product. Launch.

### Phase 5: Scale (Month 3+)
- [ ] Tournament mode
- [ ] Spectator mode
- [ ] Mobile optimization
- [ ] Premium tier
- [ ] API for embedding
- [ ] Community features (chat, forums)

---

## 10. Success Metrics

### Month 1
- [ ] MVP live on custom domain
- [ ] 100+ registered users
- [ ] Solo + 1v1 multiplayer working
- [ ] At least 1 college actively using it

### Month 3
- [ ] 1,000+ registered users
- [ ] 100+ daily active users
- [ ] College leaderboard with 5+ colleges
- [ ] Product Hunt launched
- [ ] Positive feedback on Reddit

### Month 6
- [ ] 10,000+ registered users
- [ ] 500+ daily active users
- [ ] Organic Google traffic for "typing speed test"
- [ ] First premium subscribers
- [ ] Considered adding this to portfolio/resume with real metrics

### Month 12 (Dream)
- [ ] 100,000+ registered users
- [ ] Featured on typing community channels
- [ ] Sustainable revenue from premium
- [ ] Potential for serious startup funding

---

## 11. Why This Will Work — The Core Thesis

> **People are competitive by nature. Typing is a universal skill. The intersection of competition + typing has been poorly served for 15 years. TypeClash fills that gap with modern technology, beautiful design, and social mechanics.**

Three comparable success stories:

1. **Chess.com** — Chess existed for 1500 years. Chess.com added online multiplayer + ELO + social. Now worth $500M+.
2. **Wordle** — Word guessing existed forever. Wordle added daily challenge + shareable results. Acquired by NYT for $1M+.
3. **MonkeyType** — Typing tests existed. MonkeyType added beautiful UI + customization. Now gets 50M+ visits/month.

TypeClash combines the multiplayer competitive angle (Chess.com) with the beautiful modern UI (MonkeyType) and viral sharing mechanics (Wordle).

The timing is right. The technology is ready. The builder has the skills. The market has the demand.

**Now it just needs to be built.**

---

*Document created: August 2026*
*Builder: Rounak Kumar (@rounakrkr)*
*Status: Ready for execution*
