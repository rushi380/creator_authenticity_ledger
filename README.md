# Creator Authenticity Ledger

[![CI](https://github.com/rushi380/creator_authenticity_ledger/actions/workflows/ci.yml/badge.svg)](https://github.com/rushi380/creator_authenticity_ledger/actions/workflows/ci.yml)
[![Midnight Preprod](https://img.shields.io/badge/Midnight-Preprod-7C3AED)](https://midnight.network)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

> **Prove creator legitimacy without exposing private metrics.**  
> Zero-knowledge proofs on Midnight Network let creators verify authenticity — brands see the result, never the raw data.

---

## Overview

Creator Authenticity Ledger is a privacy-preserving dApp that solves influencer fraud using Midnight's zero-knowledge architecture. A creator can prove that their engagement metrics satisfy authenticity thresholds — without disclosing their follower count, engagement figures, or any other sensitive data. Brands receive only a cryptographic verification result recorded on-chain.

**Live Demo:** `https://creator-authenticity-ledger.vercel.app` *(set after Vercel deployment)*  
**Preprod Contract:** See [Preprod Contract](#preprod-contract) section below  
**X / Product Profile:** See [X Profile](#x--product-profile) section below

---

## Problem

The influencer marketing industry is plagued by fraud:

- 🤖 **Bot networks** inflate follower counts to millions
- 💬 **Engagement pods** artificially boost likes and comments
- 📷 **Screenshot verification** is trivially manipulated in any image editor
- 🔓 **Current solutions require sharing raw private data** — creators must hand over analytics dashboards, exposing earnings, audience demographics, and platform-specific metrics to agencies and brands
- 💸 Brands lose an estimated **$1.3B+ annually** to influencer fraud

There is no trustless, privacy-preserving way for a creator to prove they are authentic without exposing sensitive private information.

---

## Solution

Creator Authenticity Ledger uses Midnight's ZK privacy model:

1. A creator enters private metrics locally (follower count, genuine engagement, consistency, audience quality)
2. The Compact smart contract circuit runs **entirely on the creator's device** via the local proof server
3. A zero-knowledge proof is generated — proving the thresholds are met **without revealing the values**
4. Only the boolean result (`isAuthentic = true`) is written to the Midnight Preprod ledger
5. Brands query the public contract state and receive the result — never the raw metrics

---

## Why Midnight

Midnight is a data-protection blockchain built specifically for applications where privacy is a core requirement. Key properties used in this dApp:

| Property | How it's used |
|---|---|
| **Compact language** | Smart contract compiles to ZK circuits; private inputs never touch the chain |
| **Witness mechanism** | Creator metrics are provided as `witness` callbacks that execute locally |
| **`disclose()` primitive** | Only the boolean result is explicitly disclosed on-chain |
| **Preprod network** | Fully deployed and verifiable; no trusted intermediary |
| **Lace Wallet** | Browser extension wallet for signing and submitting proofs |

---

## Product Idea

Creator Authenticity Ledger is a privacy-preserving platform that proves creator legitimacy without exposing personal identity, follower counts, earnings, or other sensitive creator data. The influencer fraud ecosystem includes bot networks, engagement pods, purchased followers, and comment farms. Agencies currently rely heavily on screenshots of engagement metrics, which can be manipulated. Brands need a way to verify whether a creator is authentic without requiring the creator to expose private information. Using Midnight's privacy model, creators prove that their engagement metrics satisfy predefined authenticity requirements without revealing the underlying private values. Brands receive only the result necessary to determine whether the creator is authentic.

---

## Consumer Category

**Question 2 Category: Consumer**

This dApp addresses a direct consumer and creator economy problem. Creators are the product in influencer marketing — their authenticity is their primary asset. By giving creators a privacy-preserving way to prove legitimacy, this dApp protects consumer trust in brand partnerships and creator credibility without requiring exposure of sensitive business data.

---

## Features

- 🔒 **Zero-knowledge creator verification** — private metrics never leave the device
- ✅ **On-chain boolean result** — verifiable authenticity record on Midnight Preprod
- 🌐 **Lace Wallet integration** — connect, disconnect, submit proofs
- 🏷️ **Brand verification portal** — brands look up creator records without seeing private data
- 📊 **Privacy flow diagram** — visual explanation of the ZK architecture
- 🧪 **9-test suite** — covers all circuit conditions including boundary cases
- 🤖 **GitHub Actions CI/CD** — lint, typecheck, tests, build on every push
- 🌙 **Dark mode UI** — polished React + Tailwind interface

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Creator's Browser                         │
│                                                                   │
│  ┌──────────────┐    ┌──────────────────────────────────────┐   │
│  │  React UI    │───▶│  Witness Provider                    │   │
│  │  (Verify.tsx)│    │  followerCount()          [PRIVATE]  │   │
│  └──────────────┘    │  genuineEngagementCount() [PRIVATE]  │   │
│                       │  postingConsistencyScore()[PRIVATE]  │   │
│                       │  verifiedAudienceScore()  [PRIVATE]  │   │
│                       └──────────────┬───────────────────────┘   │
│                                      │ feeds into                 │
│                       ┌──────────────▼───────────────────────┐   │
│                       │  Compact ZK Circuit (local execution) │   │
│                       │  proveAuthenticity()                  │   │
│                       │  • engagement ≥ minEngagementBps      │   │
│                       │  • consistency ≥ minConsistency       │   │
│                       │  • audienceScore ≥ minAudienceScore   │   │
│                       └──────────────┬───────────────────────┘   │
│                                      │ generates                  │
│                       ┌──────────────▼───────────────────────┐   │
│                       │       ZK Proof                        │   │
│                       │  (no private values inside)          │   │
│                       └──────────────┬───────────────────────┘   │
│                                      │                            │
└──────────────────────────────────────┼────────────────────────────┘
                                       │ submits
                        ┌──────────────▼───────────────────────┐
                        │      Midnight Preprod Network         │
                        │  isAuthentic = true   (PUBLIC)        │
                        │  minEngagementBps     (PUBLIC)        │
                        │  verificationCount    (PUBLIC)        │
                        │  followerCount        HIDDEN          │
                        │  engagementCount      HIDDEN          │
                        └──────────────────────────────────────┘
```

---

## Privacy Model

### Public State (on-chain, visible to everyone)

| Field | Type | Description |
|---|---|---|
| `verificationId` | `Bytes<32>` | Identifier for this verification |
| `isAuthentic` | `Boolean` | Result of the authenticity proof |
| `minEngagementBps` | `Uint<64>` | Required engagement rate in basis points |
| `minConsistency` | `Uint<64>` | Required consistency score (0–100) |
| `minAudienceScore` | `Uint<64>` | Required audience quality score (0–100) |
| `verificationCount` | `Uint<32>` | Total number of verifications performed |

### Private Witness (local only, never on-chain)

| Witness | Type | Description |
|---|---|---|
| `followerCount` | `Uint<64>` | Total followers — **never disclosed** |
| `genuineEngagementCount` | `Uint<64>` | Real interactions — **never disclosed** |
| `postingConsistencyScore` | `Uint<64>` | Regularity score — **never disclosed** |
| `verifiedAudienceScore` | `Uint<64>` | Audience quality — **never disclosed** |

### What an Observer CAN Learn

- The contract exists at a specific address on Midnight Preprod
- Whether the creator's metrics passed the authenticity thresholds (`isAuthentic`)
- The public threshold configuration values
- How many verifications have been performed (`verificationCount`)
- The transaction hash and block timestamp
- The wallet address that submitted the proof transaction

### What an Observer CANNOT Learn

- The creator's exact follower count
- The creator's genuine engagement count or rate
- The creator's posting consistency score
- The creator's verified audience percentage
- Any private witness value
- The creator's earnings, revenue, or financial data
- Any identity information not required for wallet authentication

> **Technical accuracy note:** Midnight's privacy model ensures private witness values are processed inside the ZK circuit on the prover's machine. The proof is a cryptographic commitment that the circuit constraints are satisfied — it reveals nothing about the witness inputs beyond what is explicitly `disclose()`-d.

---

## Authenticity Logic

The Compact circuit enforces three independent threshold checks using pure integer arithmetic (Compact does not support floating-point):

```
// Engagement rate check using basis points (avoids division)
// 300 bps = 3.00% minimum engagement rate
genuineEngagementCount × 10000  ≥  followerCount × minEngagementBps

// Posting consistency check
postingConsistencyScore  ≥  minConsistency   (e.g. 60 out of 100)

// Verified audience quality check
verifiedAudienceScore  ≥  minAudienceScore   (e.g. 70 out of 100)
```

**All three conditions must be satisfied.** If any fails, the circuit asserts and the transaction is rejected — `isAuthentic` stays `false`.

**Why basis points?** Integer arithmetic avoids rounding errors. `300 bps = 3.00%`. To check `genuine/followers >= 3%` safely: `genuine × 10000 >= followers × 300`.

---

## Technology Stack

| Layer | Technology |
|---|---|
| Blockchain | Midnight Network (Preprod) |
| Smart contract language | Compact v0.23+ |
| ZK runtime | `@midnight-ntwrk/compact-runtime` |
| Wallet | Lace Wallet (Midnight browser extension) |
| Frontend framework | React 19 + TypeScript |
| Build tool | Vite 5 |
| Styling | Tailwind CSS 3 |
| Testing | Vitest |
| Proof server | Midnight Docker proof server |
| Frontend deployment | Vercel |
| CI/CD | GitHub Actions |

---

## Project Structure

```
creator-authenticity-ledger/
├── contracts/
│   └── creator_authenticity.compact   # Compact ZK smart contract
├── managed/
│   ├── keys/                          # Compiled prover & verifier keys
│   ├── zkir/                          # ZK intermediate representation
│   └── contract_interface.ts          # Generated TypeScript bindings stub
├── public/
│   ├── keys/                          # Served keys (copied from managed/)
│   └── zkir/                          # Served ZK IR (copied from managed/)
├── src/
│   ├── components/
│   │   ├── ui/                        # Button, Card, Badge, Input
│   │   ├── Navbar.tsx
│   │   ├── WalletStatus.tsx
│   │   ├── VerificationSteps.tsx      # Proof progress state machine
│   │   └── PrivacyFlow.tsx            # ZK flow diagram
│   ├── hooks/
│   │   ├── useWallet.ts               # Lace wallet connect/disconnect
│   │   ├── useVerification.ts         # Circuit invocation state machine
│   │   └── useTheme.ts                # Dark/light mode
│   ├── pages/
│   │   ├── Home.tsx                   # Landing page
│   │   ├── Verify.tsx                 # Creator verification form
│   │   ├── Brand.tsx                  # Brand lookup portal
│   │   ├── Privacy.tsx                # Privacy model explanation
│   │   └── About.tsx                  # Product info & tech stack
│   ├── utils/
│   │   ├── contract.ts                # Wallet API & circuit simulation
│   │   ├── environment.ts             # Env config helpers
│   │   └── providers.ts               # Midnight SDK providers
│   └── types/index.ts                 # TypeScript type definitions
├── tests/
│   └── authenticity.test.ts           # 9 contract logic tests
├── scripts/
│   ├── copy-artifacts.cjs             # managed/ → public/
│   ├── deploy.cjs                     # Preprod deployment script
│   └── compile-check.cjs              # Toolchain availability check
├── evidence/                          # Screenshots and evidence files
├── .github/workflows/ci.yml           # GitHub Actions CI/CD
├── .env.example                       # Environment variable template
├── DEMO.md                            # 1-minute demo script
├── PRODUCT_X.md                       # X profile setup instructions
└── SUBMISSION_CHECKLIST.md            # Level 1–4 requirements audit
```

---

## Prerequisites

- **Node.js** v22+
- **npm** v10+
- **Git**
- **Lace Wallet** browser extension with Midnight feature enabled
- **Docker** (for local proof server on port 6300)
- **Compact CLI** (Linux/WSL/macOS only — for contract compilation)

---

## Installation

```bash
git clone https://github.com/rushi380/creator_authenticity_ledger.git
cd creator_authenticity_ledger
npm install
```

> `npm run setup` in the documentation you received belongs to a different
> Midnight CLI sample. This repository does not include that sample's local
> devnet, interactive CLI, `.midnight-state.json`, `npm run cli`, or
> `npm run test:e2e` commands. Use the deployment flow below for this project.

---

## Environment Variables

Copy `.env.example` to `.env` and fill in values:

```bash
cp .env.example .env
```

| Variable | Description | Example |
|---|---|---|
| `VITE_NETWORK` | Midnight network to connect to | `preprod` |
| `VITE_CONTRACT_ADDRESS` | Deployed contract address | `0x...` |
| `VITE_PROOF_SERVER_URL` | Local or remote proof server | `http://localhost:6300` |
| `VITE_INDEXER_URL` | Midnight indexer GraphQL endpoint | `https://indexer.midnight.network/api/v1/graphql` |
| `VITE_NODE_URL` | Midnight node RPC endpoint | `https://rpc.midnight.network` |
| `VITE_MIN_ENGAGEMENT_BPS` | Min engagement rate (basis points) | `300` (= 3.00%) |
| `VITE_MIN_CONSISTENCY` | Min posting consistency score | `60` |
| `VITE_MIN_AUDIENCE_SCORE` | Min verified audience score | `70` |

> ⚠️ Never commit `.env` containing real secrets or mnemonics.

---

## Local Development

```bash
# Start frontend dev server (http://localhost:3000)
npm run dev

# Start Midnight proof server via Docker
docker run -d -p 6300:6000 midnightnetwork/proof-server:latest
```

---

## Compile Contract

Requires Compact CLI installed (Linux/WSL/macOS):

```bash
# Install Compact toolchain
curl --proto '=https' --tlsv1.2 -LsSf \
  https://github.com/midnightntwrk/compact/releases/latest/download/compact-installer.sh | sh

# Restart shell, then compile
npm run compile:contract

# Copy generated artifacts to public/
npm run copy:artifacts
```

Output is written to `managed/` and copied to `public/keys/` and `public/zkir/`.

---

## Run Tests

```bash
# Run full test suite (9 tests)
npm test

# Watch mode
npm run test:watch
```

Tests are in `tests/authenticity.test.ts` and mirror the exact arithmetic enforced by the Compact circuit.

---

## Generate Managed Artifacts

```bash
# Full build: compile + copy artifacts
npm run build:contract

# Or step by step:
npm run compile:contract   # Compact → managed/
npm run copy:artifacts     # managed/ → public/
```

---

## Deploy

### Preprod Deployment

1. Install Compact CLI (see above)
2. Run `npm run setup` to install dependencies and compile/copy the contract artifacts
3. Start Docker proof server: `docker run -d --name midnight-proof-server -p 6300:6300 midnightntwrk/proof-server:8.1.0`
4. Run `npm run deploy:dryrun` to check the artifacts and proof server
5. Fund your wallet on Midnight Preprod
6. Set `WALLET_SEED` in your WSL environment (**never commit or paste this into chat**)
7. Run `npm run deploy:preprod`
8. Copy the resulting contract address into `.env` as `VITE_CONTRACT_ADDRESS`

```bash
read -rsp "Wallet seed: " WALLET_SEED; echo
export WALLET_SEED
npm run deploy:preprod
```

If Docker is mapped to another host port, set `VITE_PROOF_SERVER_URL` to that
port before running the dry run and deploy command, for example:
`VITE_PROOF_SERVER_URL=http://localhost:6301`.

### Frontend Deployment (Vercel)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

Set the environment variables from `.env.example` in the Vercel dashboard.

---

## Preprod Contract

| Field | Value |
|---|---|
| **Network** | Midnight Preprod |
| **Contract Address** | `DEPLOY_CONTRACT_TO_GET_ADDRESS` — see [Deploy](#deploy) |
| **Deployed At** | Pending deployment |
| **Min Engagement** | 3.00% (300 bps) |
| **Min Consistency** | 60/100 |
| **Min Audience Score** | 70/100 |

> **To deploy:** Follow the [Deploy](#deploy) section. The Compact CLI requires Linux/WSL. After deployment, update this README with the real contract address.

---

## Live Demo

> **URL:** `https://creator-authenticity-ledger.vercel.app`  
> *(Available after Vercel deployment — see [Deploy](#deploy) section)*

---

## Lace Wallet

1. Install the [Lace Wallet](https://www.lace.io) browser extension
2. Open Lace → Settings → Enable **Midnight** feature
3. Switch network to **Preprod**
4. Get Preprod DUST from the Midnight faucet
5. Click **Connect Wallet** in the app

---

## Usage

### Creator Flow

1. Open the application at `http://localhost:3000`
2. Click **Connect Wallet** — approve the connection in Lace
3. Navigate to **Verify**
4. Enter your **private creator metrics** (these never leave your browser):
   - Follower Count
   - Genuine Engagement Count
   - Posting Consistency Score (0–100)
   - Verified Audience Score (0–100)
5. Click **Prove Authenticity**
6. Watch the proof progress: Preparing → Generating ZK Proof → Executing Circuit → Submitting → Confirmed
7. Receive: **✓ Authenticity Cryptographically Verified**
8. Note: private metric values are **not displayed** after verification

### Brand Flow

1. Navigate to **Brands**
2. Enter a creator handle (try `@creator_demo`) or contract address
3. Click **Check Verification**
4. See the binary result: `AUTHENTIC ✓` or `NOT AUTHENTIC ✗`
5. Note: private data is shown as `████████████ — Protected by Midnight ZK privacy`

---

## Privacy Demonstration

The privacy claim is architectural, not cosmetic:

```
PRIVATE WITNESS (creator's device only)
  followerCount:           ████████████
  genuineEngagementCount:  ████████████
  postingConsistencyScore: ████████████
  verifiedAudienceScore:   ████████████
              ↓
   Compact ZK Circuit runs locally
   genuine × 10000 ≥ followers × 300
   consistency ≥ 60
   audience ≥ 70
              ↓
   Zero-Knowledge Proof generated
   (contains no private values)
              ↓
PUBLIC ON-CHAIN RESULT:
   isAuthentic = true   ← only this is recorded
```

The private values are supplied as **witness callbacks** to the Compact circuit — they execute inside the local proof server process and are never serialised to any network request or blockchain transaction. This is enforced by the Compact compiler's `disclose()` type system: you cannot write a witness value to the ledger without an explicit `disclose()` call.

---

## CI/CD

GitHub Actions runs on every push to `main` and every pull request:

| Job | What it checks |
|---|---|
| `lint-typecheck` | ESLint + TypeScript strict mode |
| `test` | 9-test Vitest suite |
| `contract-check` | Contract file exists, Compact toolchain check |
| `build` | Vite production build |
| `ci-gate` | All jobs must pass |

**Badge:** [![CI](https://github.com/rushi380/creator_authenticity_ledger/actions/workflows/ci.yml/badge.svg)](https://github.com/rushi380/creator_authenticity_ledger/actions/workflows/ci.yml)

---

## Demo Video

See [`DEMO.md`](DEMO.md) for the full 1-minute recording script.

**Summary:**
- 0:00 — Open application, show landing page
- 0:10 — Connect Lace Wallet
- 0:20 — Navigate to Verify, enter private metrics
- 0:35 — Submit proof, watch progress steps
- 0:48 — Show ✓ Authenticity Verified result
- 0:54 — Show that private values are redacted
- 0:58 — Show contract address on Preprod

---

## Product Proposal

**Product:** Creator Authenticity Ledger  
**Category:** Consumer  
**Tagline:** Prove creator legitimacy without exposing private metrics.

The influencer marketing industry lacks a trustless way to verify creator authenticity. Current approaches — manual platform audits, screenshot reviews, and third-party analytics tools — all require creators to share sensitive private data, while still being vulnerable to manipulation. Creator Authenticity Ledger provides a ZK-native solution: creators submit a proof that their engagement metrics satisfy brand-defined thresholds, and the blockchain records only the pass/fail result. No raw data is ever transmitted, stored, or visible. Brands get fraud-resistant verification. Creators keep their privacy.

---

## X / Product Profile

See [`PRODUCT_X.md`](PRODUCT_X.md) for the full X profile setup instructions.

**Suggested handle:** `@CreatorLedger`  
**Profile:** X profile setup is documented in `PRODUCT_X.md` and requires manual account creation.

---

## Screenshots

Evidence files are in the `evidence/` directory.

| Screenshot | Description |
|---|---|
| `evidence/compile-success.png` | Compact compiler output with circuits listed |
| `evidence/deployment.png` | Deployed contract address on Preprod |
| `evidence/tests-passing.png` | All 9 tests passing |
| `evidence/wallet-connected.png` | Lace wallet connected |
| `evidence/circuit-success.png` | Successful proof verification |
| `evidence/ci-passing.png` | GitHub Actions CI all green |

> Screenshots are captured manually after deployment. See `evidence/README.md` for capture instructions.

---

## License

MIT © 2026 Creator Authenticity Ledger
