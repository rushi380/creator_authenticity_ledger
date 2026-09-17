# Creator Authenticity Ledger — 1-Minute Demo Script

## Overview

This script guides a 60-second screen recording that demonstrates:
1. The live application
2. Lace Wallet connection
3. Private metric entry
4. ZK proof generation
5. Verification result
6. Privacy guarantee
7. Preview contract evidence

---

## Prerequisites Before Recording

- [ ] App running locally: `npm run dev` (http://localhost:3000)
- [ ] Docker proof server running: `docker run -d -p 6300:6300 midnightntwrk/proof-server:8.0.3`
- [ ] Lace Wallet installed and set to **Preview** with DUST balance
- [ ] Screen recorder ready (OBS, Loom, or QuickTime)
- [ ] Browser window at 1280×800, dark mode, full screen

---

## Recording Script

### 0:00 — 0:08 | Landing Page

**Action:** Open http://localhost:3000  
**Show:** Full landing page with title "Creator Authenticity Ledger"  
**Narrate (or caption):**
> "Creator Authenticity Ledger — a privacy-preserving dApp built on Midnight Network that lets creators prove their authenticity without exposing private engagement data."

**What to show on screen:**
- Hero title and subtitle
- "Zero-Knowledge Privacy" and "On-Chain Verification" feature cards
- The "Observer Cannot Learn" vs "Observer CAN Learn" comparison panel

---

### 0:08 — 0:18 | Connect Lace Wallet

**Action:** Click **Connect Wallet** button in the top-right navbar  
**Show:** Lace Wallet popup requesting connection approval  
**Action:** Click **Approve** in Lace  
**Show:** Navbar updates to show wallet address + "Connected" green badge  
**Narrate:**
> "We connect our Lace Wallet, which is set to Midnight Preview."

**Expected UI state:**
- Badge: `● Connected` (green, pulsing)
- Address: `mn_addr_preview1...` (truncated)
- Network: `Midnight Preview`

---

### 0:18 — 0:30 | Enter Private Creator Metrics

**Action:** Click **Verify Authenticity** or navigate to `/verify`  
**Show:** Creator Verification form with `🔒 PRIVATE` badges on each field  
**Action:** Fill in the following values:

| Field | Value | Notes |
|---|---|---|
| Follower Count | `50000` | Private — never leaves browser |
| Genuine Engagement Count | `2000` | 4.00% rate — passes 3% threshold |
| Posting Consistency Score | `75` | Passes 60 minimum |
| Verified Audience Score | `82` | Passes 70 minimum |

**Show:** Live engagement indicator turns green: "✓ Engagement rate meets threshold (4.00% vs required 3.00%)"  
**Narrate:**
> "These are the creator's private metrics. Notice the 🔒 PRIVATE badge — these values are ZK witnesses and will never be transmitted to the blockchain."

---

### 0:30 — 0:48 | Submit Proof & Watch Progress

**Action:** Click **Prove Authenticity**  
**Show:** Proof progress steps animating in real-time:

```
● Preparing          ← Building witness inputs
● Generating ZK Proof ← Local proof computation  
● Executing Circuit   ← Running Compact circuit
● Submitting          ← Broadcasting to Midnight
● Confirmed           ← Transaction on-chain
✓ Verified            ← Authenticity proven
```

**Narrate:**
> "The ZK circuit runs locally on our machine. The proof is generated without sending private values anywhere. Only the cryptographic proof is submitted to Midnight Preview."

**What to emphasize:** The multi-step progress showing real proof generation pipeline.

---

### 0:48 — 0:56 | Show Verification Result

**Action:** Wait for success screen to appear  
**Show:** 

```
✓ Authenticity Cryptographically Verified

ON-CHAIN (Public):          PRIVATE (Hidden):
✓ Authenticity: VERIFIED    🔒 Follower count: ████████
✓ Contract: 0x187ab...      🔒 Engagement data: ████████
✓ Timestamp: Sep 5, 2026    🔒 Consistency: ████████
                             🔒 Audience score: ████████
```

**Narrate:**
> "The result is recorded on Midnight Preview. The public state shows VERIFIED. The private metrics are permanently hidden — represented here as redacted blocks, because that's exactly what the ZK circuit guarantees."

---

### 0:56 — 1:00 | Contract Evidence

**Action:** Navigate to **About** page or show the footer  
**Show:** Contract address field  
**Also show (optional):** Brand page querying the deployed contract address and showing the live on-chain state  
**Narrate:**
> "The contract is deployed on Midnight Preview. Anyone can query the result — no one can query the private data."

---

## Key Moments to Highlight

| Timestamp | Highlight | Why it matters |
|---|---|---|
| 0:20 | 🔒 PRIVATE badges on input fields | Shows ZK witness design |
| 0:30 | Live engagement indicator | Shows real circuit math |
| 0:35–0:45 | Proof progress steps | Shows real pipeline, not fake |
| 0:50 | Redacted private values | Core privacy demonstration |
| 0:52 | Contract address visible | Proves Preview deployment |

---

## Screen Recording Tips

- Use **1280×800** resolution for consistent framing
- **Zoom browser to 110%** so text is readable
- Use **cursor spotlight** tool to highlight click targets
- Pause 1–2 seconds on each key moment before moving on
- Record in **dark mode** — the UI is designed for it
- Use captions or voiceover (either works)

---

## Optional Extended Demo (2 minutes)

Add these sections after the 1-minute version:

1. **Privacy page** (`/privacy`) — show the ZK flow diagram and Compact contract code excerpt
2. **Brand portal** (`/brand`) — query the deployed contract address, show the live on-chain state with redacted private data
3. **Tests** — run `npm test` in terminal, show 9 passing tests
4. **CI badge** — show GitHub Actions workflow passing

---

## Recommended Tools

| Tool | Platform | Notes |
|---|---|---|
| OBS Studio | Windows/Mac/Linux | Free, high quality |
| Loom | Browser extension | Easy sharing link |
| QuickTime | macOS | Built-in, simple |
| ShareX | Windows | Free, annotations |
