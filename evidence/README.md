# evidence/ — Screenshots and Evidence Files

This directory holds evidence screenshots and raw logs for the submission checklist.

## Evidence Files — Current Status

| Filename | What it shows | Status |
|---|---|---|
| `tests-passing.png` | Real `npm test` run — **12 tests passing (2 suites)** | ✅ Captured |
| `test-output.txt` | Raw text log of the same test run | ✅ Captured |
| `compile-success.png` | Real `compact compile contracts/creator_authenticity.compact` run (Compact 0.5.2, WSL) — exit code 0, all ZK artifacts listed | ✅ Captured |
| `compile-output.txt` | Raw text log of the same compile run | ✅ Captured |
| `deployment.png` | **Live** Midnight Preview indexer response — the deployed contract with its 9 on-chain transactions, including the deployment tx `9d3010d3…36499` | ✅ Captured |
| `chain-query-response.json` | Raw JSON of the same live indexer query | ✅ Captured |
| `circuit-success.png` | App Brand portal reading **live on-chain state**: `AUTHENTIC ✓`, verification counter, on-chain thresholds — the direct result of successful `proveAuthenticity()` circuit calls | ✅ Captured |
| `wallet-connected.png` | App navbar showing the green "Connected" badge with the connected wallet (1AM, Midnight Preview) | ✅ Captured — provided screenshot of the live connected state |

## How the captured files were produced

- `tests-passing.png` / `test-output.txt`: `npm test` (vitest) — real run, 2026-09-18.
- `compile-success.png` / `compile-output.txt`: `compact compile contracts/creator_authenticity.compact /tmp/evidence-managed` under WSL with Compact 0.5.2 — real run compiling to a temp directory (the committed `managed/` artifacts are untouched).
- `deployment.png` / `chain-query-response.json`: POST to `https://indexer.preview.midnight.network/api/v4/graphql` querying the deployed contract — the response is live chain data, unedited.
- `circuit-success.png`: the app's Brand Verification Portal querying the deployed contract address — the shown state (`AUTHENTIC`, verification counter, on-chain thresholds) is read directly from the Midnight Preview indexer.
