# evidence/ — Screenshots and Evidence Files

This directory holds evidence screenshots for the submission checklist.

## Required Screenshots

| Filename | What to capture | When |
|---|---|---|
| `compile-success.png` | Terminal output of `compact compile` showing circuits listed | After Compact CLI compilation |
| `deployment.png` | Midnight Preprod explorer showing contract address | After `node scripts/deploy.cjs` |
| `tests-passing.png` | Terminal output of `npm test` with all 9 tests green | Any time |
| `wallet-connected.png` | App navbar showing green "Connected" badge and wallet address | During live demo |
| `circuit-success.png` | Verification success screen showing ✓ AUTHENTIC | During live demo |
| `ci-passing.png` | GitHub Actions workflow showing all jobs green | After pushing to GitHub |

## How to Capture

### compile-success.png
```bash
# In WSL/Linux with Compact CLI installed:
compact compile contracts/creator_authenticity.compact ./managed
# Screenshot the terminal output
```

### tests-passing.png
```bash
npm test
# Screenshot the full terminal output showing 9 passing tests
```

### wallet-connected.png
1. Open http://localhost:3000
2. Click Connect Wallet
3. Approve in Lace
4. Screenshot the navbar showing the connected state

### circuit-success.png
1. Connect wallet
2. Navigate to /verify
3. Enter: followers=50000, engagement=2000, consistency=75, audience=82
4. Click Prove Authenticity
5. Screenshot the success screen

### ci-passing.png
1. Push to GitHub
2. Go to Actions tab
3. Click the latest workflow run
4. Screenshot all 5 jobs showing green checkmarks

### deployment.png
1. Run deploy script with funded wallet
2. Copy contract address
3. Open Midnight explorer: https://explorer.midnight.network/preprod
4. Search for your contract address
5. Screenshot the explorer showing the contract

## Tools

- **Windows:** Snipping Tool (Win+Shift+S) or ShareX
- **macOS:** Command+Shift+4 for selection screenshot
- **Linux:** gnome-screenshot or scrot

## Format

- PNG format preferred
- Minimum 1280×720 resolution
- Crop to show only relevant information
- Do not edit or manipulate screenshots
